import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useKiosk } from '../context/KioskContext';

// Fix: Cast motion to any to prevent TypeScript errors
const Motion = motion as any;

export default function Header() {
  const { settings } = useKiosk();
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const localeMap: Record<string, string> = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        ru: 'ru-RU'
      };
      const locale = localeMap[settings.language] || 'en-US';

      const dateStr = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
      setTime(`${dateStr} • ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.language]);

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-8 py-6 pointer-events-none">
      <div className="max-w-[1800px] mx-auto grid grid-cols-[1fr_auto_1fr] items-center">

        {/* LEFT: Empty (Logo Removed) */}
        <div className="justify-self-start pointer-events-auto">
        </div>

        {/* CENTER: Time Capsule */}
        <div className="justify-self-center pointer-events-auto">
          <Motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="hidden md:block"
          >
            <div className="relative group cursor-default">
              {/* Ambient Glow */}
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* The Capsule */}
              <div className="relative flex items-center gap-3 px-8 py-3 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-2xl hover:bg-white/[0.08] transition-all duration-300">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />
                <span className="text-sm font-medium text-white/90 tracking-wider uppercase font-mono">
                  {time}
                </span>
              </div>
            </div>
          </Motion.div>
        </div>

        {/* RIGHT: Empty div to maintain grid balance */}
        <div className="justify-self-end pointer-events-auto">
        </div>

      </div>
    </header>
  );
}