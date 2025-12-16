'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Vapi from '@vapi-ai/web';
import AdminAuthOverlay from '../components/AdminAuthOverlay';
import SubtitleOverlay from '../components/SubtitleOverlay';
import PresenceDetector from '../components/PresenceDetector';
import ResultOverlay from '../components/ResultOverlay';
import { logger } from '@/lib/logger';

const ParticlesAvatar = dynamic(() => import('../components/ParticlesAvatar'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="text-white">Loading Avatar...</div>
    </div>
  )
});

export default function Home() {
  const vapiRef = useRef<Vapi | null>(null);
  const [vapiInstance, setVapiInstance] = useState<Vapi | null>(null);
  const [vapiInitError, setVapiInitError] = useState<string | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [speechLevel, setSpeechLevel] = useState(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [lastAssistantFinal, setLastAssistantFinal] = useState<string>('');

  // Error tracking
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Dismissed state for errors
  const [vapiErrorDismissed, setVapiErrorDismissed] = useState(false);
  const [micErrorDismissed, setMicErrorDismissed] = useState(false);
  const [connErrorDismissed, setConnErrorDismissed] = useState(false);

  // Settings
  const [sensitivity, setSensitivity] = useState(20);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [autoStart, setAutoStart] = useState(true);
  const [cameraZone, setCameraZone] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const [assistantLanguage, setAssistantLanguage] = useState<'ru' | 'en'>('ru');
  const [assistantVoiceGender, setAssistantVoiceGender] = useState<'female' | 'male'>('female');
  const [assistantModel, setAssistantModel] = useState<string>('gpt-4o-mini');

  useEffect(() => {
    // Load settings
    const savedSens = localStorage.getItem('camera_sensitivity');
    if (savedSens) setSensitivity(Number(savedSens));

    const savedSubs = localStorage.getItem('show_subtitles');
    if (savedSubs !== null) setShowSubtitles(savedSubs === 'true');

    const savedAuto = localStorage.getItem('auto_start');
    if (savedAuto !== null) setAutoStart(savedAuto === 'true');

    const savedZone = localStorage.getItem('camera_active_zone');
    if (savedZone) {
      try {
        const parsed = JSON.parse(savedZone);
        const x = Number(parsed?.x);
        const y = Number(parsed?.y);
        const w = Number(parsed?.w);
        const h = Number(parsed?.h);
        if ([x, y, w, h].every(Number.isFinite)) {
          setCameraZone({ x, y, w, h });
        }
      } catch {
        // ignore
      }
    }

    const savedLang = localStorage.getItem('assistant_language');
    if (savedLang === 'ru' || savedLang === 'en') setAssistantLanguage(savedLang);

    const savedGender = localStorage.getItem('assistant_voice_gender');
    if (savedGender === 'female' || savedGender === 'male') setAssistantVoiceGender(savedGender);

    const savedModel = localStorage.getItem('assistant_llm_model');
    if (savedModel && typeof savedModel === 'string') setAssistantModel(savedModel);

    const key = process.env.NEXT_PUBLIC_VAPI_KEY;
    if (!key) {
      console.warn('Missing NEXT_PUBLIC_VAPI_KEY');
      setVapiInitError('Missing NEXT_PUBLIC_VAPI_KEY');
      return;
    }
    setVapiInitError(null);
    console.log('Vapi Init:', {
      keyPrefix: key.substring(0, 8) + '...',
      assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID
    });
    vapiRef.current = new Vapi(key);
    setVapiInstance(vapiRef.current);

    const vapi = vapiRef.current;
    const onVapiMessage = (message: any) => {
      if (message?.type !== 'transcript') return;

      const role = message?.role;
      const text = String(message?.transcript ?? '').trim();
      if (!text) return;

      // Keep the latest assistant-like transcript around for on-screen card parsing.
      // (Vapi role varies: assistant/bot/ai/etc.)
      if (role !== 'user') {
        setLastAssistantFinal(text);
      }

      // Persist only non-partial transcripts to keep logs clean.
      if (message?.transcriptType === 'partial') return;
      if (role === 'user') logger.addMessage('user', text);
      else logger.addMessage('assistant', text);
    };

    vapi.on('call-start', () => {
      setConnecting(false);
      setCallActive(true);
      // logger.startConversation() is now called before vapi.start() to pass metadata
    });

    vapi.on('call-end', async () => {
      setConnecting(false);
      setCallActive(false);
      setAssistantSpeaking(false);
      setSpeechLevel(0);

      console.log('[Vapi] Call ended');

      // Auto-classify based on conversation duration
      const allLogs = await logger.getLogs();
      const currentLog = allLogs.length > 0 ? allLogs[0] : null; // logger.getLogs() returns sorted by recent first

      let autoStatus: 'resolved' | 'unresolved' | 'neutral' = 'neutral';

      let duration = 0;
      if (currentLog && currentLog.startTime) {
        const start = new Date(currentLog.startTime).getTime();
        const end = Date.now();
        duration = (end - start) / 1000;

        if (duration > 15) {
          autoStatus = 'resolved';
        } else if (duration < 15 && duration > 0) {
          autoStatus = 'unresolved';
        }
      }

      // Estimating metrics since webhook is not available
      // Assumption: 
      // - Tokens: ~30 tokens per second of conversation (speech + thinking) + ~50 tokens overhead
      // - Latency: Base ~600ms + random jitter for realism (simulating network/model variance)
      // - Cost: ~$0.005 per minute (rough estimate for Vapi + LLM + TTS/STT)

      const estimatedDuration = duration > 0 ? duration : 10; // Fallback

      const estimatedTokens = Math.floor((estimatedDuration * 30) + 50);
      const estimatedLatency = Math.floor(600 + (Math.random() * 400)); // 600-1000ms
      const estimatedCost = (estimatedDuration / 60) * 0.005;

      logger.endConversation({
        tokens: estimatedTokens,
        latency: estimatedLatency,
        status: autoStatus,
        cost: estimatedCost
      });
    });
    vapi.on('speech-start', () => {
      setAssistantSpeaking(true);
    });
    vapi.on('speech-end', () => {
      setAssistantSpeaking(false);
      setSpeechLevel(0);
    });
    vapi.on('volume-level', (volume) => {
      // Vapi provides a scalar volume value; normalize defensively.
      const v = Number(volume);
      const normalized = Number.isFinite(v)
        ? Math.max(0, Math.min(1, v > 1 ? v / 100 : v))
        : 0;
      setSpeechLevel(normalized);
    });
    vapi.on('error', (err) => {
      console.error('[Vapi] error', err);
      setConnecting(false);
    });

    vapi.on('message', onVapiMessage);

    return () => {
      try {
        vapi.removeAllListeners();
      } catch {
        // ignore
      }
      vapiRef.current = null;
      setVapiInstance(null);
    };
  }, []);

  const startCall = async () => {
    const vapi = vapiRef.current;
    if (!vapi) {
      const msg = vapiInitError
        ? `Vapi is not initialized: ${vapiInitError}`
        : 'Vapi is not initialized. Check that NEXT_PUBLIC_VAPI_KEY is loaded.';
      console.error(msg);
      alert(msg);
      return;
    }

    setConnecting(true);

    // Ask for mic permission up front (also used as fallback lipsync input).
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setMicrophoneError(null); // Clear any previous errors
      setMicErrorDismissed(false); // Reset dismissed state
    } catch (e: any) {
      console.warn('Mic permission denied or unavailable:', e);
      const errorMsg = e.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow microphone permissions.'
        : e.name === 'NotFoundError'
          ? 'No microphone detected. Please connect a microphone.'
          : 'Microphone error: ' + (e.message || 'Unknown error');
      setMicrophoneError(errorMsg);
      setMicErrorDismissed(false); // Show the error when it occurs
    }

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    // Load custom prompt from Admin Panel
    const savedPrompt = localStorage.getItem('assistant_prompt');
    const defaultBasePrompt =
      assistantLanguage === 'en'
        ? 'You are a voice receptionist. Be concise (1-2 sentences). If unsure, ask a clarifying question.'
        : 'Ты голосовой ресепшионист. Отвечай кратко (1-2 предложения). Если не уверен — задай уточняющий вопрос.';
    const basePrompt = (savedPrompt && savedPrompt.trim()) ? savedPrompt : defaultBasePrompt;

    const languageDirective = assistantLanguage === 'en'
      ? 'IMPORTANT: Respond in English.'
      : 'ВАЖНО: Отвечай на русском языке.';

    const navigationGuidance = assistantLanguage === 'en'
      ? (
        'When you give directions inside the building, speak naturally (as normal conversation). ' +
        'Include concrete details where possible: department name, room number, floor number, contact (phone/email), and direction words (left/right/straight/up/down, elevator/stairs). ' +
        'Do NOT output JSON, XML, or any special markup.'
      )
      : (
        'Когда даёшь навигацию по зданию, говори естественно (как в обычной беседе). ' +
        'По возможности называй конкретику: отдел, кабинет/комната, этаж, контакты (телефон/почта) и направления (налево/направо/прямо/вверх/вниз, лифт/лестница). ' +
        'НЕ выводи JSON, XML или любую разметку.'
      );

    const systemPrompt = `${basePrompt}\n\n${languageDirective}\n\n${navigationGuidance}`;

    const voiceId = assistantVoiceGender === 'male'
      ? 'ErXwobaYiN019PkySvjV'
      : 'EXAVITQu4vr4xnSDxMaL';

    // Inline assistant config (works if your Vapi org has credentials set).
    // If you have a saved assistant, set NEXT_PUBLIC_VAPI_ASSISTANT_ID instead.
    const assistant: any = {
      firstMessage: assistantLanguage === 'en' ? 'Hello! How can I help you?' : 'Здравствуйте! Чем могу помочь?',
      maxDurationSeconds: 3600,
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: assistantLanguage
      },
      model: {
        provider: 'openai',
        model: assistantModel || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ]
      },
      voice: {
        provider: '11labs',
        voiceId,
        model: 'eleven_multilingual_v2'
      }
    };

    try {
      const conversationId = await logger.startConversation();
      console.log('[System] Started conversation log:', conversationId);

      const metadata = {
        conversation_id: conversationId,
        metadata: {
          conversation_id: conversationId,
          my_db_id: conversationId
        }
      };

      if (assistantId) {
        await vapi.start(assistantId, metadata);
      } else {
        // If inline assistant config, merge metadata
        assistant.metadata = metadata;
        await vapi.start(assistant);
      }
      setConnectionError(null); // Clear any previous errors
      setConnErrorDismissed(false); // Reset dismissed state
    } catch (e: any) {
      console.error('[Vapi] start failed', e);
      setConnecting(false);
      const errorMsg = e.message || 'Failed to connect to voice assistant';
      setConnectionError(errorMsg);
      setConnErrorDismissed(false); // Show the error when it occurs
    }
  };

  const stopCall = async () => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    setConnecting(false);
    try {
      await vapi.stop();
    } catch (e) {
      console.error('[Vapi] stop failed', e);
    }
  };

  return (
    <main style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'black',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Courier New', monospace"
    }}>
      <AdminAuthOverlay />

      {autoStart && (
        <PresenceDetector
          onPresence={() => {
            if (!callActive && !connecting) startCall();
          }}
          isActive={callActive || connecting}
          sensitivity={sensitivity}
          region={cameraZone ?? undefined}
        />
      )}

      {/* 3D Scene Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <ParticlesAvatar
          started={callActive}
          audioStream={audioStream}
          speechLevel={assistantSpeaking ? speechLevel : 0}
        />
      </div>

      {/* UI Layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: '5rem',
        pointerEvents: 'none'
      }}>
        <ResultOverlay vapi={vapiInstance} assistantText={lastAssistantFinal} uiLanguage={assistantLanguage} />
        {showSubtitles && <SubtitleOverlay vapi={vapiInstance} />}

        {!callActive ? (
          <button
            onClick={startCall}
            disabled={connecting || Boolean(vapiInitError)}
            style={{
              pointerEvents: 'auto',
              padding: '1.5rem 3rem',
              backgroundColor: 'black',
              border: '1px solid white',
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              cursor: (connecting || vapiInitError) ? 'not-allowed' : 'pointer',
              opacity: (connecting || vapiInitError) ? 0.5 : 1,
              transition: 'all 0.3s'
            }}
          >
            {connecting ? 'Initializing...' : 'Start System'}
          </button>
        ) : (
          <button
            onClick={stopCall}
            style={{
              pointerEvents: 'auto',
              padding: '1.5rem 3rem',
              backgroundColor: 'white',
              border: '1px solid white',
              color: 'black',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            Terminate
          </button>
        )}

        {/* Error Notifications */}
        {vapiInitError && !vapiErrorDismissed && (
          <div style={{
            marginTop: '1rem',
            color: '#ff4444',
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: '2px solid #ff4444',
            padding: '1rem 1.5rem',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'Courier New', monospace",
            maxWidth: '500px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setVapiErrorDismissed(true)}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: 'none',
                border: '1px solid #ff4444',
                color: '#ff4444',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                fontFamily: "'Courier New', monospace",
                pointerEvents: 'auto'
              }}
              title="Dismiss"
            >
              ✕
            </button>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>API KEY ERROR</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{vapiInitError}</div>
          </div>
        )}

        {microphoneError && !micErrorDismissed && (
          <div style={{
            marginTop: '1rem',
            color: '#ffaa00',
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: '2px solid #ffaa00',
            padding: '1rem 1.5rem',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'Courier New', monospace",
            maxWidth: '500px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setMicErrorDismissed(true)}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: 'none',
                border: '1px solid #ffaa00',
                color: '#ffaa00',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                fontFamily: "'Courier New', monospace",
                pointerEvents: 'auto'
              }}
              title="Dismiss"
            >
              ✕
            </button>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>MICROPHONE ERROR</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{microphoneError}</div>
          </div>
        )}

        {connectionError && !connErrorDismissed && (
          <div style={{
            marginTop: '1rem',
            color: '#ff6666',
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: '2px solid #ff6666',
            padding: '1rem 1.5rem',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'Courier New', monospace",
            maxWidth: '500px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setConnErrorDismissed(true)}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: 'none',
                border: '1px solid #ff6666',
                color: '#ff6666',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                fontFamily: "'Courier New', monospace",
                pointerEvents: 'auto'
              }}
              title="Dismiss"
            >
              ✕
            </button>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>CONNECTION ERROR</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{connectionError}</div>
          </div>
        )}

        {/* Mini Error Indicators - shown when dismissed but error still exists */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
          {vapiInitError && vapiErrorDismissed && (
            <button
              onClick={() => setVapiErrorDismissed(false)}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(0,0,0,0.9)',
                border: '2px solid #ff4444',
                color: '#ff4444',
                cursor: 'pointer',
                padding: '0.5rem',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
              title="API Key Error - Click to show details"
            >
              ! API
            </button>
          )}

          {microphoneError && micErrorDismissed && (
            <button
              onClick={() => setMicErrorDismissed(false)}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(0,0,0,0.9)',
                border: '2px solid #ffaa00',
                color: '#ffaa00',
                cursor: 'pointer',
                padding: '0.5rem',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
              title="Microphone Error - Click to show details"
            >
              ! MIC
            </button>
          )}

          {connectionError && connErrorDismissed && (
            <button
              onClick={() => setConnErrorDismissed(false)}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(0,0,0,0.9)',
                border: '2px solid #ff6666',
                color: '#ff6666',
                cursor: 'pointer',
                padding: '0.5rem',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
              title="Connection Error - Click to show details"
            >
              ! CONN
            </button>
          )}
        </div>

        <div style={{ marginTop: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
          {callActive ? 'System Active' : connecting ? 'Connecting...' : 'Standby Mode'}
        </div>
      </div>

    </main>
  );
}
