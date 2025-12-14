import React, { useEffect, useRef } from 'react';

export default function AuroraBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add subtle interactive movement on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { clientX, clientY } = e;
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      const x = clientX / width;
      const y = clientY / height;
      
      const layers = containerRef.current.querySelectorAll('.aurora-layer') as NodeListOf<HTMLElement>;
      layers.forEach((layer, index) => {
        const speed = 0.02 * (index + 1);
        const xOffset = (x - 0.5) * speed * 100;
        const yOffset = (y - 0.5) * speed * 100;
        
        layer.style.transform = `${layer.dataset.originalTransform} translate(${xOffset}px, ${yOffset}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Corporate-friendly color palette inspired by healthcare/finance
  const colors = {
    primary: '#0F0C29', // Deep navy background
    accent1: '#1A5F7A', // Professional teal
    accent2: '#2D4263', // Corporate blue
    accent3: '#C84B31', // Trustworthy burnt orange
    accent4: '#ECDBBA', // Warm neutral
    highlight: '#4D96FF', // Bright blue for highlights
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ backgroundColor: colors.primary }}
    >
      {/* Noise Texture Generator - More subtle for professional look */}
      <svg className="hidden">
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0.1" />
          <feBlend mode="overlay" in2="SourceGraphic" />
        </filter>
      </svg>

      {/* Geometric Grid Pattern - Adds structure */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${colors.accent4} 1px, transparent 1px),
            linear-gradient(to bottom, ${colors.accent4} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* LAYER 1: Primary Corporate Gradient (Top Center) */}
      <div
        className="aurora-layer absolute top-[-15%] left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] rounded-full mix-blend-soft-light filter blur-[100px] opacity-40"
        data-original-transform="scale(1.2)"
        style={{
          background: `radial-gradient(circle, ${colors.accent1} 0%, transparent 70%)`,
        }}
      />

      {/* LAYER 2: Secondary Corporate Accent (Right Side) */}
      <div
        className="aurora-layer absolute top-[15%] right-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-overlay filter blur-[80px] opacity-30"
        data-original-transform="rotate(45deg) scale(1)"
        style={{
          background: `linear-gradient(135deg, ${colors.accent2}, ${colors.highlight})`,
        }}
      />

      {/* LAYER 3: Warm Accent (Left Side) */}
      <div
        className="aurora-layer absolute bottom-[10%] left-[-15%] w-[60vw] h-[60vw] rounded-full mix-blend-color-dodge filter blur-[120px] opacity-25"
        data-original-transform="rotate(-30deg) scale(1.1)"
        style={{
          background: `linear-gradient(45deg, ${colors.accent3}, ${colors.accent4})`,
        }}
      />

      {/* LAYER 4: Central Glow */}
      <div
        className="aurora-layer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full mix-blend-screen filter blur-[60px] opacity-20"
        data-original-transform="scale(1)"
        style={{
          background: `radial-gradient(circle, ${colors.highlight} 0%, transparent 70%)`,
        }}
      />

      {/* LAYER 5: Subtle Bottom Reflection */}
      <div
        className="aurora-layer absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[30vw] rounded-full mix-blend-plus-lighter filter blur-[100px] opacity-15"
        data-original-transform="scale(1.5, 0.8)"
        style={{
          background: `linear-gradient(to top, ${colors.accent4}, transparent)`,
        }}
      />

      {/* LAYER 6: Noise Overlay - More subtle */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{ filter: 'url(#noiseFilter)' }}
      />

      {/* LAYER 7: Professional Vignette */}
      <div 
        className="absolute inset-0 z-40 opacity-40"
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 0%,
            ${colors.primary} 70%
          )`,
        }}
      />

      {/* LAYER 8: Subtle Angular Lines for Modern Look */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.02]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] rotate-45"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 50px,
              ${colors.accent4} 50px,
              ${colors.accent4} 51px
            )`,
          }}
        />
      </div>

      {/* Animated Particles for subtle movement */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              background: colors.highlight,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.1,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px);
          }
          50% {
            transform: translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px);
          }
          75% {
            transform: translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px);
          }
        }
        
        .aurora-layer {
          transition: transform 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}