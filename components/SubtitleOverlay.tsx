import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKiosk } from '../context/KioskContext';
import { AppState } from '../types';

// Fix: Cast motion to any to prevent TypeScript errors
const Motion = motion as any;

export default function SubtitleOverlay() {
  const { transcript, appState } = useKiosk();

  // Don't show subtitles if system is totally idle (sleep mode handles that)
  if (appState === AppState.IDLE) return null;

  return (
    <div className="fixed bottom-40 left-0 w-full flex justify-center pointer-events-none z-40 px-6">
      <AnimatePresence mode="wait">
        {transcript && (
          <Motion.div
            key={transcript} // Triggers animation on text change
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="max-w-2xl w-full"
          >
            <div className="relative group">
              {/* Glass Card */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xl rounded-2xl -z-10 shadow-2xl border border-white/10" />
              
              {/* Glowing Accent Border */}
              <div className={`absolute inset-0 rounded-2xl -z-20 opacity-30 blur-xl transition-colors duration-500
                ${appState === AppState.SPEAKING ? 'bg-purple-500' : 'bg-blue-500'}
              `} />

              {/* Content */}
              <div className="p-6 md:p-8 text-center">
                {appState === AppState.PROCESSING ? (
                  <div className="flex items-center justify-center gap-2 text-white/60 h-8">
                     <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                     <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                     <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                  </div>
                ) : (
                  <p className="text-xl md:text-2xl font-light leading-relaxed tracking-wide text-white drop-shadow-sm">
                    "{transcript}"
                  </p>
                )}
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}