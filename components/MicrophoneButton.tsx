import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Loader2, Radio } from 'lucide-react';
import { useKiosk } from '../context/KioskContext';
import { AppState } from '../types';

// Fix: Cast motion to any to prevent TypeScript errors
const Motion = motion as any;

export default function MicrophoneButton() {
  const { appState, startSession, stopSession, error, t } = useKiosk();

  // Don't show if Idle (SleepOverlay covers it)
  if (appState === AppState.IDLE) return null;

  const isRecording = appState === AppState.LISTENING;
  const isProcessing = appState === AppState.PROCESSING;
  const isSpeaking = appState === AppState.SPEAKING;

  return (
    <div className="fixed bottom-12 left-0 right-0 z-50 flex flex-col items-center justify-center pointer-events-none">

      {/* Error Message Tooltip */}
      <AnimatePresence>
        {error && (
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-6 px-4 py-2 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-full text-red-200 text-sm font-medium shadow-lg"
          >
            {error}
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Main Button Container */}
      <Motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseDown={startSession}
        onMouseUp={stopSession}
        onTouchStart={(e: any) => { e.preventDefault(); startSession(); }}
        onTouchEnd={(e: any) => { e.preventDefault(); stopSession(); }}
        disabled={isProcessing}
        className={`
          pointer-events-auto relative flex items-center justify-center w-24 h-24 rounded-full
          backdrop-blur-2xl transition-all duration-300 border shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
          ${isRecording
            ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_50px_rgba(220,38,38,0.5)]'
            : isProcessing
              ? 'bg-blue-500/10 border-blue-500/30 cursor-wait'
              : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'
          }
        `}
      >
        {/* Animated Rings for Recording State */}
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full border border-red-500/40 animate-ping" />
            <span className="absolute inset-0 rounded-full border border-red-500/20 animate-pulse delay-75" />
          </>
        )}

        {/* Icon Content */}
        <div className={`relative z-10 transition-colors duration-300 ${isRecording ? 'text-red-400' : 'text-white'}`}>
          {isProcessing ? (
            <Loader2 size={40} className="animate-spin text-blue-400" />
          ) : isRecording ? (
            <Radio size={40} className="animate-pulse" />
          ) : (
            <Mic size={40} className={isSpeaking ? 'text-purple-300' : 'text-white/90'} />
          )}
        </div>

        {/* Inner Glass Reflection */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
      </Motion.button>

      {/* Label Text */}
      <div className="mt-4 h-6 text-center">
        <AnimatePresence mode="wait">
          <Motion.p
            key={appState}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs font-medium tracking-[0.2em] text-white/50 uppercase"
          >
            {isRecording ? t('ReleaseToSend') : isProcessing ? t('ProcessingRequest') : t('HoldToSpeak')}
          </Motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}