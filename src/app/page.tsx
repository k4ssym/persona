'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Vapi from '@vapi-ai/web';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { logger } from '@/lib/logger';

const Avatar3D = dynamic(() => import('@/components/Avatar3D'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-16 h-16 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
});

const VAPI_PUBLIC_KEY = 'e10e6537-c43f-4eac-abfa-e8516445d6a1';
const AVATAR_URL = 'https://models.readyplayer.me/693d88c9e37c2412ef9d8da8.glb';

type CallStatus = 'idle' | 'connecting' | 'active' | 'error';

export default function Home() {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState('');
  const [autoMode, setAutoMode] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);
  const autoStartTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startCallRef = useRef<(() => void) | null>(null);

  const { videoRef, canvasRef, startCamera, stopCamera, isDetecting, hasFace } = useFaceDetection({
    onFaceDetected: () => {
      if (status === 'idle' && autoMode) {
        autoStartTimeout.current = setTimeout(() => {
          startCallRef.current?.();
        }, 1000);
      }
    },
    onFaceLost: () => {
      if (autoStartTimeout.current !== null) {
        clearTimeout(autoStartTimeout.current);
      }
    }
  });

  useEffect(() => {
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    vapi.on('call-start', () => {
      setStatus('active');
      setTranscript('Слушаю...');
      setIsListening(true);
      logger.startConversation();
    });

    vapi.on('call-end', () => {
      setStatus('idle');
      setTranscript('');
      setIsSpeaking(false);
      setIsListening(false);
      logger.endConversation();
    });

    vapi.on('speech-start', () => {
      setIsSpeaking(true);
      setIsListening(false);
    });

    vapi.on('speech-end', () => {
      setIsSpeaking(false);
      setIsListening(true);
    });

    vapi.on('message', (msg) => {
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        setTranscript(msg.transcript);
        logger.addMessage(msg.role === 'user' ? 'user' : 'assistant', msg.transcript);
      }
    });

    vapi.on('volume-level', (level) => {
      setVolume(level);
    });

    vapi.on('error', (err) => {
      console.error('Vapi error:', err);
      setError('Ошибка');
      setStatus('error');
    });

    return () => { 
      vapi.stop();
      stopCamera();
    };
  }, [stopCamera]);

  const startCall = useCallback(async () => {
    if (!vapiRef.current || status !== 'idle') return;
    setStatus('connecting');
    setError('');
    setTranscript('Подключение...');

    try {
      await vapiRef.current.start({
        name: "Reception",
        firstMessage: "Здравствуйте! Добро пожаловать. Чем могу помочь?",
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [{
            role: "system",
            content: `Ты — голосовой консультант. Говори кратко, 1-2 предложения. ТОЛЬКО на русском языке.

ОТДЕЛЫ КОМПАНИИ:
- Отдел продаж: 2 этаж, кабинет 203
- Техподдержка: 1 этаж, кабинет 105
- HR отдел: 3 этаж, кабинет 301
- Бухгалтерия: 2 этаж, кабинет 210
- Руководство: 4 этаж, кабинет 401

Помогай посетителям найти нужный отдел. Всегда называй этаж и номер кабинета.`
          }]
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
          model: "eleven_multilingual_v2"
        },
        transcriber: { provider: "deepgram", model: "nova-2", language: "ru" }
      });
    } catch (e) {
      setError('Ошибка подключения');
      setStatus('error');
    }
  }, [status]);

  // Update ref for face detection callback
  useEffect(() => {
    startCallRef.current = startCall;
  }, [startCall]);

  const endCall = () => {
    vapiRef.current?.stop();
    setStatus('idle');
    setTranscript('');
    setIsSpeaking(false);
    setIsListening(false);
  };

  const toggleAutoMode = () => {
    if (!autoMode) {
      startCamera();
      setAutoMode(true);
    } else {
      stopCamera();
      setAutoMode(false);
    }
  };

  const isActive = status === 'active';
  const isConnecting = status === 'connecting';

  return (
    <main className="min-h-screen h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Hidden video/canvas for face detection */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {/* 3D Avatar */}
      <Avatar3D
        avatarUrl={AVATAR_URL}
        isSpeaking={isSpeaking}
        isListening={isListening}
        isActive={isActive || isConnecting}
        volume={volume}
      />

      {/* UI Overlay */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center pointer-events-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Ресепшн</h1>
            
            {/* Auto mode toggle */}
            <button
              onClick={toggleAutoMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                autoMode 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              {autoMode ? (hasFace ? 'Лицо 👤' : 'Авто ✓') : 'Авто'}
            </button>
          </div>
          
          {/* Status indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all ${
            isActive 
              ? isSpeaking 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
              : isConnecting
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-white/5 text-white/40 border border-white/10'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isActive ? (isSpeaking ? 'bg-blue-400' : 'bg-green-400 animate-pulse') 
                : isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-white/40'
            }`} />
            {isActive ? (isSpeaking ? 'Говорит' : 'Слушает') : isConnecting ? 'Подключение' : 'Оффлайн'}
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 pb-12 pt-6 px-6 flex flex-col items-center gap-6 pointer-events-auto bg-gradient-to-t from-black/60 to-transparent">
          {/* Transcript */}
          <div className="max-w-lg text-center bg-black/50 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10">
            <p className={`text-xl font-medium transition-all ${
              error ? 'text-red-400' : isSpeaking ? 'text-white' : 'text-white/90'
            }`}>
              {error || transcript || (isActive ? '' : autoMode ? 'Подойдите ближе для начала разговора' : 'Нажмите чтобы поговорить')}
            </p>
          </div>

          {/* Button */}
          <button
            onClick={isActive ? endCall : startCall}
            disabled={isConnecting}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isActive 
                ? 'bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/50' 
                : 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-2xl shadow-purple-500/50'
            } disabled:opacity-50`}
          >
            {isActive ? (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : isConnecting ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z"/>
                <path d="M19 10v1a7 7 0 01-14 0v-1M12 19v3"/>
              </svg>
            )}
          </button>
        </div>

        {/* Admin link */}
        <a 
          href="/admin" 
          className="fixed bottom-4 right-4 text-white/20 hover:text-white/40 text-xs pointer-events-auto"
        >
          Админ
        </a>
      </div>

      <KeyboardHandler 
        onSpace={() => isActive ? endCall() : startCall()}
        disabled={isConnecting}
      />
    </main>
  );
}

function KeyboardHandler({ onSpace, disabled }: { onSpace: () => void; disabled: boolean }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !disabled) {
        e.preventDefault();
        onSpace();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSpace, disabled]);
  return null;
}
