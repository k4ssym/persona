import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Clock } from 'lucide-react';
import IndoorMap from './IndoorMap';
import Typewriter from './Typewriter';
import { useKiosk } from '../context/KioskContext';

// Fix: Cast motion to any to prevent TypeScript errors
const Motion = motion as any;

interface ActionOverlayProps {
  onClose: () => void;
}

export default function ActionOverlay({ onClose }: ActionOverlayProps) {
  const { t } = useKiosk();
  const [timeLeft, setTimeLeft] = useState(20);

  // Auto-close countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <Motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60"
    >
      <div className="relative w-full max-w-6xl h-[80vh] bg-[#0F0C29]/80 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row backdrop-blur-xl">

        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />

        {/* --- LEFT PANEL: INSTRUCTIONS --- */}
        <div className="w-full md:w-1/3 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div>
            <div className="flex items-center gap-3 mb-8 text-blue-400">
              <Navigation size={28} className="animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-[0.2em]">{t('GuidanceActive')}</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-light text-white leading-tight mb-6">
              <Typewriter text={t('ProceedToRoom')} delay={0.2} />
            </h2>

            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="space-y-4 text-white/60 text-lg font-light"
            >
              <p>{t('Step1')}</p>
              <p>{t('Step2')}</p>
              <p>{t('Step3')}</p>
            </Motion.div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Clock size={16} />
              <span>{t('ClosingIn')} {timeLeft}s</span>
            </div>
            {/* Progress Bar for Timer */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <Motion.div
                className="h-full bg-white/30"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 20, ease: "linear" }}
              />
            </div>
          </div>
        </div>

        {/* --- RIGHT PANEL: MAP VISUALIZATION --- */}
        <div className="w-full md:w-2/3 relative bg-black/20">
          <IndoorMap />

          {/* Close Button Absolute */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 backdrop-blur-md group"
          >
            <X size={24} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

      </div>
    </Motion.div>
  );
}