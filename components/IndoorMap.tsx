import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

// Fix: Cast motion to any to prevent TypeScript errors
const Motion = motion as any;

export default function IndoorMap() {
  // SVG ViewBox dimensions: 0 0 800 600
  
  // Navigation Path coordinates (Reception -> Hallway -> Sales 203)
  const pathData = "M 400 520 L 400 300 L 600 300 L 600 180";

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <div className="relative w-full aspect-[4/3] max-w-4xl bg-[#0a0a0c] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }} 
        />

        <svg viewBox="0 0 800 600" className="w-full h-full relative z-10">
          
          {/* --- ROOMS (Floor Plan) --- */}
          
          {/* Reception (Bottom Center) */}
          <g transform="translate(300, 480)">
             <rect width="200" height="100" rx="4" fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
             <text x="100" y="55" fill="rgba(255,255,255,0.5)" fontSize="14" textAnchor="middle" fontFamily="sans-serif">RECEPTION</text>
          </g>

          {/* Coffee Area (Top Left) */}
          <g transform="translate(50, 50)">
             <path d="M0,0 H150 V150 H0 Z" fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
             <text x="75" y="80" fill="rgba(255,255,255,0.5)" fontSize="14" textAnchor="middle" fontFamily="sans-serif">COFFEE</text>
          </g>

          {/* Conf Room A (Top Center) */}
          <g transform="translate(250, 50)">
             <rect width="250" height="150" rx="4" fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
             <text x="125" y="80" fill="rgba(255,255,255,0.5)" fontSize="14" textAnchor="middle" fontFamily="sans-serif">CONF ROOM A</text>
          </g>

          {/* Sales / Room 203 (Right) - THE DESTINATION */}
          <g transform="translate(550, 100)">
             <rect width="200" height="200" rx="4" fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.5" />
             <text x="100" y="100" fill="#60a5fa" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">SALES (203)</text>
          </g>


          {/* --- ANIMATED PATH --- */}
          <Motion.path
            d={pathData}
            fill="transparent"
            stroke="#3b82f6" // Blue-500
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
            style={{ filter: "drop-shadow(0 0 8px rgba(59,130,246, 0.8))" }}
          />

          {/* --- MARKERS --- */}

          {/* Start Point Pulse */}
          <g transform="translate(400, 520)">
            <circle r="8" fill="#fff" />
            <Motion.circle 
              r="20" 
              fill="none" 
              stroke="#fff" 
              strokeWidth="2"
              animate={{ scale: [1, 2], opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </g>
        </svg>

        {/* End Point Pin (HTML overlay on top of SVG for easier icon usage) */}
        <Motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, type: "spring" }}
          className="absolute top-[30%] left-[75%] -translate-x-1/2 -translate-y-full"
        >
          <div className="relative">
             <MapPin size={40} className="text-blue-500 fill-blue-500/20 drop-shadow-[0_0_15px_rgba(59,130,246,1)]" />
             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-blue-500/50 blur-[2px] rounded-full" />
          </div>
        </Motion.div>

        {/* Legend / Info */}
        <div className="absolute bottom-6 left-6 flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
            <span className="text-xs text-white/70 uppercase tracking-wider">You are here</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-blue-500" />
            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Destination</span>
          </div>
        </div>

      </div>
    </div>
  );
}