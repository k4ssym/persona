import React from 'react';
import { motion } from 'framer-motion';
import {
  Home, BarChart2, FileText, Settings, RotateCcw
} from 'lucide-react';
import { useKiosk } from '../context/KioskContext';
import { ActiveView } from '../types';

// Fix: Cast motion to any to prevent TypeScript errors
const Motion = motion as any;

const sidebarVariants = {
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
      when: "beforeChildren"
    }
  }
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3 } }
};

export default function Sidebar() {
  const { resetKiosk, activeView, setActiveView, t } = useKiosk();

  const menuItems: { id: ActiveView; icon: any; label: string }[] = [
    { id: 'home', icon: Home, label: t('Home') },
    { id: 'analytics', icon: BarChart2, label: t('Analytics') },
    { id: 'logs', icon: FileText, label: t('Logs') },
    { id: 'settings', icon: Settings, label: t('Settings') },
  ];

  return (
    <Motion.div
      className="fixed left-0 top-0 h-full w-20 z-50 flex flex-col items-center py-8 gap-6
                 bg-gradient-to-b from-[#0a0a0a]/90 to-[#000000]/95 backdrop-blur-2xl border-r border-white/5 shadow-2xl"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >

      {/* --- Brand / Logo --- */}
      <Motion.div
        variants={itemVariants}
        className="w-10 h-10 mb-2 select-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <img
          src="/logo.png"
          alt="Brand Logo"
          className="w-full h-full object-contain rounded-xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        />
      </Motion.div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col gap-3 w-full items-center justify-center">
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <Motion.button
              key={item.id}
              variants={itemVariants}
              onClick={() => setActiveView(item.id)}
              className="group relative flex items-center justify-center w-full h-14"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >

              {/* --- ACTIVE STATE BACKGROUND (The "Color" Fix) --- */}
              {isActive && (
                <Motion.div
                  layoutId="activeNavBackdrop"
                  // CHANGE THE COLORS HERE:
                  // Currently set to: bg-blue-500/20 (Blue tint)
                  // Try: bg-purple-500/20, bg-emerald-500/20, etc.
                  className="absolute inset-0 mx-3 my-1 rounded-xl 
                             bg-blue-500/20 border border-blue-500/30 
                             shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div className={`relative z-10 transition-all duration-300 
                ${isActive
                  ? 'text-blue-100 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' // Active Icon Color
                  : 'text-white/40 group-hover:text-white/90' // Inactive Icon Color
                }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>

              {/* Active Left Indicator (The Bar) */}
              {isActive && (
                <Motion.div
                  layoutId="activeNavIndicator"
                  // Ensure this matches your background color (bg-blue-500)
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_12px_#3b82f6]"
                />
              )}

              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1a1a1a]/90 backdrop-blur-md border border-white/10 text-white text-xs font-medium rounded-lg 
                            opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 
                            transition-all duration-300 ease-out whitespace-nowrap pointer-events-none shadow-xl z-50">
                {item.label}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1a1a1a]/90 rotate-45 border-l border-b border-white/10" />
              </div>
            </Motion.button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <Motion.div
        variants={itemVariants}
        className="flex flex-col gap-5 items-center w-full"
      >
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <Motion.button
          onClick={resetKiosk}
          whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.15)" }}
          whileTap={{ scale: 0.9, rotate: -10 }}
          className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-white/30 hover:text-red-400 transition-colors duration-300"
        >
          <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-700 ease-out" />

          <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1a1a1a]/90 backdrop-blur-md border border-white/10 text-red-200 text-xs font-medium rounded-lg 
                        opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 
                        transition-all duration-300 ease-out whitespace-nowrap pointer-events-none shadow-xl z-50">
            {t('ResetSystem')}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1a1a1a]/90 rotate-45 border-l border-b border-white/10" />
          </div>
        </Motion.button>
      </Motion.div>

    </Motion.div>
  );
}