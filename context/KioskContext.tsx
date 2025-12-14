import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { AppState, KioskContextType, LogEntry, ActiveView, AppSettings, ChatMessage } from '../types';
import { supabase } from '../lib/supabase';
import { translations, TranslationKeys, Language } from '../lib/translations';

const KioskContext = createContext<KioskContextType | undefined>(undefined);

// VAD Constants
const MAX_RECORDING_LENGTH = 15000;

const DEFAULT_SETTINGS: AppSettings = {
  systemPrompt: "You are Persona, a futuristic AI Virtual Receptionist. Answer briefly.",
  sensitivity: 0.7,
  presenceTimeout: 30,
  subtitlesEnabled: true,
  language: 'en',
  voiceId: 'shimmer',
  speechSpeed: 1.0,
  detectionZone: { x: 10, y: 10, w: 80, h: 80 }
};

const LANGUAGE_MAP: Record<string, string> = {
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'ru': 'ru-RU'
};


export const KioskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [motionDetected, setMotionDetected] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showDashboard, setShowDashboard] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // New States
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Fetch logs on mount
  useEffect(() => {
    const fetchLogs = async () => {
      console.log('🔍 Fetching logs from Supabase...');
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) {
        console.error('❌ Error fetching logs:', error);
      } else if (data) {
        console.log('✅ Fetched', data.length, 'logs from database');
        const mappedLogs: LogEntry[] = data.map((item: any) => ({
          id: item.id,
          startTime: new Date(item.start_time),
          userQuery: item.user_query,
          department: item.department,
          status: item.status,
          duration: item.duration,
          isFlagged: item.is_flagged,
          metadata: item.metadata,
          messages: item.messages
        }));
        setLogs(mappedLogs);
      }
    };

    fetchLogs();
  }, [activeView]); // Re-fetch when view changes (optional optimization)

  // Derived States
  const isIdle = appState === AppState.IDLE;
  const inConversation = [AppState.LISTENING, AppState.PROCESSING, AppState.SPEAKING].includes(appState);

  // Audio Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const toggleMute = useCallback(() => {
    setIsMicOn(prev => !prev);
  }, []);

  const toggleDashboard = useCallback(() => {
    setShowDashboard(prev => !prev);
  }, []);

  const toggleMotion = useCallback(() => {
    setMotionDetected(prev => !prev);
  }, []);

  const clearAction = useCallback(() => {
    setLastAction(null);
  }, []);

  const triggerAction = useCallback((action: string) => {
    setLastAction(action);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleLogFlag = useCallback(async (id: string) => {
    // Optimistic Update
    setLogs(prevLogs =>
      prevLogs.map(log => log.id === id ? { ...log, isFlagged: !log.isFlagged } : log)
    );

    // DB Update
    const log = logs.find(l => l.id === id);
    if (log) {
      const { error } = await supabase
        .from('logs')
        .update({ is_flagged: !log.isFlagged })
        .eq('id', id);

      if (error) console.error("Error updating flag:", error);
    }
  }, [logs]);

  const wakeSystem = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      setAppState(AppState.READY);
      setMotionDetected(true);
      setShowDashboard(true);
    } catch (e) {
      console.error("Audio Context Wake Failed:", e);
      setAppState(AppState.READY);
      setMotionDetected(true);
      setShowDashboard(true);
    }
  }, []);

  const playResponseAudio = async (base64Audio: string) => {
    return new Promise<void>((resolve) => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;

      audio.onended = () => resolve();
      audio.onerror = (e) => {
        console.error("Playback error", e);
        resolve();
      };

      audio.play().catch(e => {
        console.error("Playback start error:", e);
        resolve();
      });
    });
  };

  const processUserAudio = async (audioBlob: Blob, textTranscript?: string) => {
    if (audioBlob.size < 1000 && !textTranscript) {
      if (appState !== AppState.IDLE) {
        startListening();
      }
      return;
    }

    setAppState(AppState.PROCESSING);
    const requestStartTime = Date.now();

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "input.wav");
      formData.append("language", settings.language);

      console.log('🎤 Sending audio to /api/conversation...');
      const response = await fetch('/api/conversation', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error("API Error: " + errorText);
      }

      const data = await response.json();
      const processingTime = Date.now() - requestStartTime;

      console.log('✅ API Response received in', processingTime + 'ms');
      console.log('📝 User:', data.user_text);
      console.log('🤖 AI:', data.ai_text);

      setTranscript(data.ai_text);

      const startTime = new Date();
      const newLogData = {
        start_time: startTime.toISOString(),
        user_query: data.user_text || textTranscript || "Audio Input",
        department: "General",
        status: data.action === 'CALL_HUMAN' ? 'escalated' : 'resolved',
        duration: Math.round(processingTime / 1000) + "s",
        is_flagged: false,
        metadata: {
          latency: processingTime,
          confidence: 0.95,
          model: 'gpt-4o-mini',
          tokensUsed: 150
        },
        messages: [
          { role: 'user', text: data.user_text || textTranscript || "Audio Input", timestamp: startTime.toLocaleTimeString() },
          { role: 'ai', text: data.ai_text, timestamp: new Date().toLocaleTimeString() }
        ] as ChatMessage[]
      };

      console.log('💾 Attempting to save to Supabase...');
      console.log('Data to insert:', JSON.stringify(newLogData, null, 2));

      // Insert into Supabase
      const { data: insertedLog, error: logError } = await supabase
        .from('logs')
        .insert([newLogData])
        .select()
        .single();

      if (logError) {
        console.error("❌ Supabase Insert Error:", logError);
        console.error("Error code:", logError.code);
        console.error("Error message:", logError.message);
        console.error("Error details:", logError.details);
        console.error("Error hint:", logError.hint);

        // Fallback to local state
        const fallbackLog: LogEntry = {
          id: Date.now().toString(),
          startTime: startTime,
          userQuery: newLogData.user_query,
          department: newLogData.department,
          status: newLogData.status as any,
          duration: newLogData.duration,
          isFlagged: newLogData.is_flagged,
          messages: newLogData.messages,
          metadata: newLogData.metadata
        };
        setLogs(prev => [fallbackLog, ...prev]);
      } else if (insertedLog) {
        console.log('✅ Successfully saved to Supabase!', insertedLog);
        const newLog: LogEntry = {
          id: insertedLog.id,
          startTime: new Date(insertedLog.start_time),
          userQuery: insertedLog.user_query,
          department: insertedLog.department,
          status: insertedLog.status,
          duration: insertedLog.duration,
          isFlagged: insertedLog.is_flagged,
          messages: insertedLog.messages,
          metadata: insertedLog.metadata
        };
        setLogs(prev => [newLog, ...prev]);
      }

      // --- SMART ROUTE LOGIC ---
      const keywords = ["route", "map", "203", "directions", "where is", "navigate", "location"];
      const combinedText = ((data.user_text || "") + " " + (data.ai_text || "")).toLowerCase();
      const shouldShowMap = keywords.some(k => combinedText.includes(k));

      if (shouldShowMap || (data.action && data.action === 'SHOW_MAP')) {
        setLastAction('SHOW_MAP');
      } else if (data.action && data.action !== 'IDLE') {
        setLastAction(data.action);
      }
      // -------------------------

      setAppState(AppState.SPEAKING);
      if (data.audio_base64) {
        await playResponseAudio(data.audio_base64);
      }

      if (!isIdle) {
        startListening();
      }

    } catch (err) {
      console.error("❌ Processing failed", err);
      setError("Connection Error");
      setAppState(AppState.READY);
    }
  };

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      setTranscript("");
      setAppState(AppState.LISTENING);
      setError(undefined);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = LANGUAGE_MAP[settings.language] || 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            interimTranscript += event.results[i][0].transcript;
          }
          if (interimTranscript) setTranscript(interimTranscript);
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("Speech recognition start warning:", e);
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) { }
        processUserAudio(audioBlob, transcript);
      };

      mediaRecorder.start();

      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, MAX_RECORDING_LENGTH);

    } catch (e: any) {
      console.error("Mic Error:", e);
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError("Microphone permission denied.");
      } else {
        setError("Microphone error.");
      }
      setAppState(AppState.ERROR);
    }
  }, []);

  const enterConversation = useCallback(() => {
    startListening();
  }, [startListening]);

  const exitConversation = useCallback(() => {
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    stopListening();
    setAppState(AppState.READY);
    setTranscript("");
    setLastAction(null);
  }, [stopListening]);

  const resetKiosk = useCallback(() => {
    exitConversation();
    setAppState(AppState.IDLE);
    setShowDashboard(true);
    setLastAction(null);
    setActiveView('home');
  }, [exitConversation]);

  const t = useCallback((key: TranslationKeys): string => {
    const lang = settings.language;
    // Simple fallback: if language is not 'ru', use 'en' (since we only have en/ru for now)
    const activeLang: Language = (lang === 'ru') ? 'ru' : 'en';
    return translations[activeLang][key] || key;
  }, [settings.language]);

  return (
    <KioskContext.Provider value={{
      appState, motionDetected, transcript, error, isMicOn, isIdle, inConversation, showDashboard, lastAction,
      activeView, logs, settings,
      wakeSystem, enterConversation, exitConversation,
      toggleMotion,
      toggleMute, resetKiosk, toggleDashboard, clearAction, triggerAction,
      startSession: startListening,
      stopSession: stopListening,
      setActiveView, updateSettings, toggleLogFlag,
      t
    }}>
      {children}
    </KioskContext.Provider>
  );
};

export const useKiosk = () => {
  const context = useContext(KioskContext);
  if (!context) throw new Error('useKiosk must be used within a KioskProvider');
  return context;
};
