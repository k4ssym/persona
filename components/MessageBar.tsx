import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKiosk } from '../context/KioskContext';
import { AppState } from '../types';
import Typewriter from './Typewriter';

// Fix: Cast motion to any to prevent TypeScript errors
const Motion = motion as any;

export default function MessageBar() {
  const { transcript, appState, isMicOn, t } = useKiosk();

  // Determine what to show
  const isListening = appState === AppState.LISTENING;
  const isProcessing = appState === AppState.PROCESSING;
  const isSpeaking = appState === AppState.SPEAKING;

  // Status Text Logic
  const statusText = isListening ? t('ListeningActive') : isProcessing ? t('ProcessingRequest') : isSpeaking ? t('Speaking') : t('SystemReady');
  const statusColor = isListening ? "bg-red-500" : isProcessing ? "bg-blue-500" : isSpeaking ? "bg-purple-500" : "bg-emerald-500";

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between pt-[15vh] pb-12 pointer-events-none">

      {/* 1. Main Conversation Text (Typewriter) */}
      <div className="w-full max-w-5xl px-8 text-center min-h-[200px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {transcript ? (
            <Motion.div
              key={transcript} // Re-animate on new text
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white leading-tight drop-shadow-2xl">
                <Typewriter text={transcript} delay={0} hideCursorOnComplete={true} />
              </h2>
            </Motion.div>
          ) : (
            // Placeholder/Prompt when empty state in conversation
            <Motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="text-4xl font-light tracking-widest uppercase text-white"
            >
              {isListening ? "" : ""}
            </Motion.h2>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Bottom Status Capsule */}
      <Motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto"
      >
        <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
          {/* Audio Visualizer / Pulse */}
          <div className="flex items-center gap-1 h-4">
            {[1, 2, 3, 4].map(i => (
              <Motion.div
                key={i}
                animate={{ height: isListening || isSpeaking ? [8, 16, 8] : 4 }}
                transition={{
                  repeat: Infinity,
                  duration: 0.5,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
                className={`w-1 rounded-full ${isListening ? 'bg-red-400' : 'bg-white/50'}`}
              />
            ))}
          </div>

          <div className="w-px h-4 bg-white/20" />

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor} shadow-[0_0_10px_currentColor] animate-pulse`} />
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">{statusText}</span>
          </div>
        </div>
      </Motion.div>
    </div>
  );
}