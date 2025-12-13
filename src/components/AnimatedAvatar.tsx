'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

interface AnimatedAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isActive: boolean;
}

export function AnimatedAvatar({ isSpeaking, isListening, isActive }: AnimatedAvatarProps) {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Customer service / receptionist animation
    fetch('https://assets9.lottiefiles.com/packages/lf20_jcikwtux.json')
      .then(res => res.json())
      .then(setAnimationData)
      .catch(() => {
        // Fallback - friendly robot
        fetch('https://assets3.lottiefiles.com/packages/lf20_si8fqh4y.json')
          .then(res => res.json())
          .then(setAnimationData);
      });
  }, []);

  const glowColor = isListening ? 'rgba(34, 197, 94, 0.5)' 
    : isSpeaking ? 'rgba(59, 130, 246, 0.5)' 
    : 'rgba(139, 92, 246, 0.3)';

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96">
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full blur-[80px] transition-all duration-700"
        style={{ 
          background: glowColor,
          transform: `scale(${isActive ? 1.5 : 1.2})`
        }}
      />
      
      {/* Animated rings */}
      {isActive && (
        <>
          <div className={`absolute inset-4 rounded-full border transition-all duration-300 animate-ping ${
            isListening ? 'border-green-500/20' : 'border-blue-500/20'
          }`} style={{ animationDuration: '2s' }} />
        </>
      )}
      
      {/* Main ring */}
      <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
        isListening ? 'border-green-500/40' :
        isSpeaking ? 'border-blue-500/40' :
        'border-purple-500/30'
      }`} />
      
      {/* Avatar container */}
      <div className="relative w-full h-full flex items-center justify-center p-8">
        {animationData ? (
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          // Fallback - animated face
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-48 h-48">
              {/* Face */}
              <circle cx="50" cy="50" r="45" fill="#1a1a2e" stroke={isListening ? '#22c55e' : isSpeaking ? '#3b82f6' : '#8b5cf6'} strokeWidth="2" />
              
              {/* Eyes */}
              <ellipse cx="35" cy="40" rx="6" ry="8" fill="white" />
              <ellipse cx="65" cy="40" rx="6" ry="8" fill="white" />
              <circle cx="35" cy="40" r="3" fill={isListening ? '#22c55e' : '#3b82f6'} />
              <circle cx="65" cy="40" r="3" fill={isListening ? '#22c55e' : '#3b82f6'} />
              
              {/* Mouth */}
              {isSpeaking ? (
                <ellipse cx="50" cy="65" rx="12" ry={8 + Math.random() * 4} fill="#0f0f1a" stroke="#3b82f6" strokeWidth="2">
                  <animate attributeName="ry" values="6;12;6" dur="0.3s" repeatCount="indefinite" />
                </ellipse>
              ) : (
                <path d="M 35 65 Q 50 75 65 65" fill="none" stroke={isListening ? '#22c55e' : '#8b5cf6'} strokeWidth="3" strokeLinecap="round" />
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm transition-all ${
        isSpeaking 
          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
          : isListening 
            ? 'bg-green-500/20 text-green-300 border border-green-500/40'
            : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
      }`}>
        {isSpeaking ? '💬 Говорю' : isListening ? '👂 Слушаю' : '👋 Привет'}
      </div>
    </div>
  );
}

export default AnimatedAvatar;

