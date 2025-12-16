'use client';

import { useEffect, useRef, useState } from 'react';

type PresenceRegion = {
  /** Left offset in %, 0..100 */
  x: number;
  /** Top offset in %, 0..100 */
  y: number;
  /** Width in %, 0..100 */
  w: number;
  /** Height in %, 0..100 */
  h: number;
};

interface PresenceDetectorProps {
  onPresence: () => void;
  isActive: boolean; // If true, detection is paused (we are already talking)
  sensitivity?: number; // 0..100
  debug?: boolean;
  /** Active detection region (ROI) in % of the video frame. Defaults to full frame. */
  region?: PresenceRegion;
}

export default function PresenceDetector({
  onPresence,
  isActive,
  sensitivity = 20,
  debug = false,
  region,
}: PresenceDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameRef = useRef<Uint8ClampedArray | null>(null);
  const lastTriggerAtRef = useRef<number>(0);
  const hitStreakRef = useRef<number>(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [motionValue, setMotionValue] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, frameRate: 10 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ensure playback starts across browsers (some won't advance readyState without play()).
          try {
            await videoRef.current.play();
          } catch {
            // ignore
          }
          setHasPermission(true);
        }
      } catch (e) {
        console.warn('Presence detection disabled: No camera access', e);
      }
    };

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!hasPermission) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let intervalId: NodeJS.Timeout;

    const clamp01 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);
    const clampInt = (n: number, min: number, max: number) => {
      const v = Math.round(Number(n));
      if (!Number.isFinite(v)) return min;
      return Math.max(min, Math.min(max, v));
    };

    const checkMotion = () => {
      // HAVE_CURRENT_DATA (2) is enough for drawImage() to work reliably.
      if (video.readyState < 2) return;

      ctx.drawImage(video, 0, 0, 64, 48); // Low res for performance
      const frame = ctx.getImageData(0, 0, 64, 48);
      const data = frame.data;

      // Region of interest (ROI) in pixels
      const roi = region
        ? {
            x: clamp01(region.x / 100),
            y: clamp01(region.y / 100),
            w: clamp01(region.w / 100),
            h: clamp01(region.h / 100),
          }
        : { x: 0, y: 0, w: 1, h: 1 };

      const x0 = clampInt(Math.floor(roi.x * 64), 0, 63);
      const y0 = clampInt(Math.floor(roi.y * 48), 0, 47);
      const x1 = clampInt(Math.ceil((roi.x + roi.w) * 64), x0 + 1, 64);
      const y1 = clampInt(Math.ceil((roi.y + roi.h) * 48), y0 + 1, 48);
      const area = Math.max(1, (x1 - x0) * (y1 - y0));

      if (lastFrameRef.current) {
        let diff = 0;
        const prev = lastFrameRef.current;

        // Simple pixel diff ONLY inside ROI
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * 64 + x) * 4;
            const r = Math.abs(data[i] - prev[i]);
            const g = Math.abs(data[i + 1] - prev[i + 1]);
            const b = Math.abs(data[i + 2] - prev[i + 2]);
            if (r + g + b > 100) diff++;
          }
        }

        // Threshold based on sensitivity
        // sensitivity 20 => need ~8% pixels changed (within ROI)
        const threshold = (100 - sensitivity) * area * 0.0016;

        if (debug) setMotionValue(diff);

        // Debounce: require 2 consecutive hits and cooldown
        const now = Date.now();
        const cooldownMs = 3000;
        const hitsNeeded = 2;

        if (!isActive && diff > threshold) {
          hitStreakRef.current += 1;
          if (hitStreakRef.current >= hitsNeeded && now - lastTriggerAtRef.current > cooldownMs) {
            lastTriggerAtRef.current = now;
            hitStreakRef.current = 0;
            onPresence();
          }
        } else {
          hitStreakRef.current = 0;
        }
      }

      lastFrameRef.current = new Uint8ClampedArray(data);
    };

    intervalId = setInterval(checkMotion, 500); // Check 2 times per second

    return () => clearInterval(intervalId);
  }, [hasPermission, isActive, sensitivity, onPresence, debug, region]);

  return (
    <div
      style={
        debug
          ? { width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }
          : {
              position: 'absolute',
              left: 0,
              top: 0,
              width: 1,
              height: 1,
              opacity: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: -1,
            }
      }
    >
      {debug && (
        <div style={{ 
          position: 'absolute', 
          top: '0.5rem', 
          left: '0.5rem', 
          zIndex: 10, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          padding: '0.25rem 0.5rem',
          fontSize: '10px',
          color: 'white',
          fontFamily: "'Courier New', monospace",
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          DELTA: {motionValue}
        </div>
      )}
      {debug && region && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.max(0, Math.min(100, region.x))}%`,
            top: `${Math.max(0, Math.min(100, region.y))}%`,
            width: `${Math.max(0, Math.min(100, region.w))}%`,
            height: `${Math.max(0, Math.min(100, region.h))}%`,
            border: '2px solid rgba(255,255,255,0.9)',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
            zIndex: 9,
          }}
        />
      )}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: debug ? 0.5 : 0 }} 
      />
      <canvas ref={canvasRef} width={64} height={48} style={{ display: 'none' }} />
    </div>
  );
}
