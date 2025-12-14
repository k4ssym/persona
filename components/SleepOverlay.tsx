import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKiosk } from '../context/KioskContext';
import { ScanFace, Fingerprint } from 'lucide-react';

// Fix: Cast motion to any to prevent TypeScript errors
const Motion = motion as any;

interface SleepOverlayProps {
  onWake?: () => void;
}

export default function SleepOverlay({ onWake }: SleepOverlayProps) {
  const { isIdle, wakeSystem, t } = useKiosk();

  const handleInteraction = () => {
    if (onWake) onWake();
    wakeSystem();
  };

  return (
    <AnimatePresence>
      {isIdle && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onClick={handleInteraction}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl cursor-pointer group select-none"
        >
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] animate-pulse-slow" />
          </div>

          {/* Interactive Hero Content */}
          <div className="relative z-10 flex flex-col items-center gap-10 text-center transition-transform duration-500 group-hover:scale-105">
            <Motion.div
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: ["0 0 0px rgba(255, 255, 255, 0)", "0 0 40px rgba(255, 255, 255, 0.1)", "0 0 0px rgba(255, 255, 255, 0)"]
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative p-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl group-hover:bg-white/15 transition-colors"
            >
              <ScanFace size={64} className="text-white/80" />
              <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-20" />
            </Motion.div>

            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-extralight tracking-[0.2em] text-white drop-shadow-2xl">
                {t('SystemIdle')}
              </h2>
              <div className="flex items-center justify-center gap-3 text-white/50 text-xs md:text-sm tracking-[0.3em] uppercase">
                <Fingerprint size={14} />
                <span>{t('TouchToInitialize')}</span>
              </div>
            </div>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}