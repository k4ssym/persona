'use client';

import { useEffect, useState } from 'react';

interface MascotProps {
  isSpeaking: boolean;
  isListening: boolean;
  volume: number;
  isActive: boolean;
}

export function Mascot({ isSpeaking, isListening, volume, isActive }: MascotProps) {
  const [blink, setBlink] = useState(false);
  const [mouthHeight, setMouthHeight] = useState(10);

  // Blink animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Mouth animation based on volume
  useEffect(() => {
    if (isSpeaking) {
      setMouthHeight(10 + volume * 30);
    } else {
      setMouthHeight(10);
    }
  }, [isSpeaking, volume]);

  const glowColor = isListening ? '#22c55e' : isSpeaking ? '#3b82f6' : '#8b5cf6';
  const eyeColor = isActive ? (isListening ? '#22c55e' : '#3b82f6') : '#8b5cf6';

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80">
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full blur-3xl transition-all duration-500"
        style={{ 
          background: glowColor,
          opacity: isActive ? 0.3 : 0.1,
          transform: `scale(${isActive ? 1.2 : 1})`
        }}
      />

      {/* Main face container */}
      <div className="relative w-full h-full">
        {/* Face background */}
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Outer ring - animated */}
          <circle 
            cx="100" 
            cy="100" 
            r="95" 
            fill="none" 
            stroke={glowColor}
            strokeWidth="2"
            opacity={isActive ? 0.5 : 0.2}
            className="transition-all duration-300"
          >
            {isActive && (
              <animate 
                attributeName="r" 
                values="93;97;93" 
                dur="2s" 
                repeatCount="indefinite"
              />
            )}
          </circle>

          {/* Face circle */}
          <circle 
            cx="100" 
            cy="100" 
            r="85" 
            fill="url(#faceGradient)"
            className="transition-all duration-300"
          />

          {/* Gradients */}
          <defs>
            <radialGradient id="faceGradient" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#2a2a3a" />
              <stop offset="100%" stopColor="#0f0f1a" />
            </radialGradient>
            <radialGradient id="eyeGlow">
              <stop offset="0%" stopColor={eyeColor} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Left eye */}
          <g transform="translate(60, 80)">
            {/* Eye glow */}
            <ellipse 
              cx="0" 
              cy="0" 
              rx="20" 
              ry="20" 
              fill="url(#eyeGlow)" 
              opacity="0.3"
            />
            {/* Eye white */}
            <ellipse 
              cx="0" 
              cy="0" 
              rx={blink ? 15 : 15} 
              ry={blink ? 2 : 18} 
              fill="white"
              className="transition-all duration-100"
            />
            {/* Pupil */}
            {!blink && (
              <>
                <ellipse 
                  cx="0" 
                  cy="0" 
                  rx="8" 
                  ry="10" 
                  fill={eyeColor}
                  className="transition-colors duration-300"
                />
                <ellipse 
                  cx="3" 
                  cy="-3" 
                  rx="3" 
                  ry="3" 
                  fill="white" 
                  opacity="0.8"
                />
              </>
            )}
          </g>

          {/* Right eye */}
          <g transform="translate(140, 80)">
            {/* Eye glow */}
            <ellipse 
              cx="0" 
              cy="0" 
              rx="20" 
              ry="20" 
              fill="url(#eyeGlow)" 
              opacity="0.3"
            />
            {/* Eye white */}
            <ellipse 
              cx="0" 
              cy="0" 
              rx={blink ? 15 : 15} 
              ry={blink ? 2 : 18} 
              fill="white"
              className="transition-all duration-100"
            />
            {/* Pupil */}
            {!blink && (
              <>
                <ellipse 
                  cx="0" 
                  cy="0" 
                  rx="8" 
                  ry="10" 
                  fill={eyeColor}
                  className="transition-colors duration-300"
                />
                <ellipse 
                  cx="3" 
                  cy="-3" 
                  rx="3" 
                  ry="3" 
                  fill="white" 
                  opacity="0.8"
                />
              </>
            )}
          </g>

          {/* Mouth */}
          <g transform="translate(100, 130)">
            {isSpeaking ? (
              // Speaking mouth - animated
              <ellipse 
                cx="0" 
                cy="0" 
                rx="20" 
                ry={mouthHeight}
                fill="#1a1a2e"
                stroke={glowColor}
                strokeWidth="2"
                className="transition-all duration-75"
              />
            ) : isListening ? (
              // Listening - small open mouth
              <ellipse 
                cx="0" 
                cy="0" 
                rx="15" 
                ry="8"
                fill="#1a1a2e"
                stroke="#22c55e"
                strokeWidth="2"
              />
            ) : (
              // Idle - smile
              <path 
                d="M -25 0 Q 0 20 25 0" 
                fill="none" 
                stroke="#8b5cf6"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
          </g>

          {/* Sound waves when speaking */}
          {isSpeaking && (
            <>
              <circle 
                cx="100" 
                cy="100" 
                r="90" 
                fill="none" 
                stroke={glowColor}
                strokeWidth="1"
                opacity="0.3"
              >
                <animate 
                  attributeName="r" 
                  values="90;110;90" 
                  dur="0.5s" 
                  repeatCount="indefinite"
                />
                <animate 
                  attributeName="opacity" 
                  values="0.3;0;0.3" 
                  dur="0.5s" 
                  repeatCount="indefinite"
                />
              </circle>
              <circle 
                cx="100" 
                cy="100" 
                r="85" 
                fill="none" 
                stroke={glowColor}
                strokeWidth="1"
                opacity="0.2"
              >
                <animate 
                  attributeName="r" 
                  values="85;105;85" 
                  dur="0.7s" 
                  repeatCount="indefinite"
                />
                <animate 
                  attributeName="opacity" 
                  values="0.2;0;0.2" 
                  dur="0.7s" 
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}

          {/* Listening indicator */}
          {isListening && (
            <g transform="translate(100, 170)">
              {[0, 1, 2, 3, 4].map((i) => (
                <rect
                  key={i}
                  x={-20 + i * 10}
                  y={-10}
                  width="6"
                  height={10 + Math.random() * volume * 20}
                  rx="3"
                  fill="#22c55e"
                  opacity="0.8"
                >
                  <animate 
                    attributeName="height" 
                    values={`${5 + i * 2};${15 + i * 3};${5 + i * 2}`}
                    dur={`${0.3 + i * 0.1}s`}
                    repeatCount="indefinite"
                  />
                </rect>
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* Status text */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <span className={`text-xs font-medium px-3 py-1 rounded-full transition-all duration-300 ${
          isSpeaking 
            ? 'bg-blue-500/20 text-blue-400' 
            : isListening 
              ? 'bg-green-500/20 text-green-400'
              : 'bg-purple-500/20 text-purple-400'
        }`}>
          {isSpeaking ? '💬 Говорю' : isListening ? '👂 Слушаю' : '😊 Привет'}
        </span>
      </div>
    </div>
  );
}

export default Mascot;

