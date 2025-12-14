import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { useKiosk } from '../context/KioskContext';
import { AppState } from '../types';

// Fix: Cast motion to any to prevent TypeScript errors
const Motion = motion as any;

export default function MuteToggle() {
  const { isMicOn, toggleMute, appState } = useKiosk();

  if (appState === AppState.IDLE) return null;

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center">
      <Motion.button
        onClick={toggleMute}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`
          relative flex items-center justify-center w-16 h-16 rounded-full
          transition-all duration-500 backdrop-blur-md border
          ${isMicOn 
            ? 'bg-blue-600/20 border-blue-400/50 shadow-[0_0_30px_rgba(37,99,235,0.4)]' 
            : 'bg-white/5 border-white/10 text-white/40'}
        `}
      >
        {/* Glowing Ring when Active */}
        {isMicOn && (
          <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-pulse-slow" />
        )}

        <div className="relative z-10">
          {isMicOn ? (
            <Mic size={24} className="text-blue-200" />
          ) : (
            <MicOff size={24} />
          )}
        </div>
      </Motion.button>
    </div>
  );
}