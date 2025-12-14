import React, { useState, useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import { SPLINE_SCENE_URL } from '../constants';

export default function AvatarScene() {
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent scroll wheel propagation to disable zooming while keeping mouse tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 w-full h-full overflow-hidden">
      {/* Loading Placeholder */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10 text-white/50 animate-pulse">
          <p className="text-sm tracking-widest uppercase">Initializing Neural Core...</p>
        </div>
      )}
      
      {/* 
         pointer-events-auto: Enables Mouse Tracking (Look At) 
         The useEffect above blocks the zoom (Wheel)
      */}
      <div className="absolute w-full h-[120%] -bottom-[10%] cursor-default">
        <Spline 
            scene={SPLINE_SCENE_URL}
            onLoad={() => setLoading(false)}
            className="w-full h-full"
            style={{ 
              backgroundColor: 'transparent',
            }} 
        />
      </div>
    </div>
  );
}