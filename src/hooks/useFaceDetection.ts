'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseFaceDetectionOptions {
  onFaceDetected?: () => void;
  onFaceLost?: () => void;
  detectionInterval?: number; // ms between detections
  faceConfidenceThreshold?: number; // 0-1
}

export function useFaceDetection({
  onFaceDetected,
  onFaceLost,
  detectionInterval = 500,
  faceConfidenceThreshold = 0.7
}: UseFaceDetectionOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFaceTime = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsDetecting(true);
        setError(null);
      }
    } catch (err) {
      setError('Не удалось получить доступ к камере');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsDetecting(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // Simple face detection using canvas brightness analysis
  // (более простой подход без тяжёлых ML библиотек)
  const detectFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isDetecting) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== 4) {
      animationRef.current = requestAnimationFrame(detectFace);
      return;
    }

    canvas.width = 160;
    canvas.height = 120;
    ctx.drawImage(video, 0, 0, 160, 120);

    // Analyze center region for skin tones (simple heuristic)
    const centerX = 60;
    const centerY = 30;
    const regionSize = 40;
    
    const imageData = ctx.getImageData(centerX, centerY, regionSize, regionSize);
    const data = imageData.data;
    
    let skinPixels = 0;
    let totalPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Simple skin tone detection
      if (r > 80 && g > 40 && b > 20 &&
          r > g && r > b &&
          Math.abs(r - g) > 15 &&
          r - b > 15) {
        skinPixels++;
      }
      totalPixels++;
    }

    const skinRatio = skinPixels / totalPixels;
    const faceDetected = skinRatio > 0.15; // 15% skin pixels = likely face

    const now = Date.now();
    
    if (faceDetected) {
      lastFaceTime.current = now;
      if (!hasFace) {
        setHasFace(true);
        onFaceDetected?.();
      }
    } else {
      // Face lost after 2 seconds of no detection
      if (hasFace && now - lastFaceTime.current > 2000) {
        setHasFace(false);
        onFaceLost?.();
      }
    }

    // Continue detection loop
    setTimeout(() => {
      animationRef.current = requestAnimationFrame(detectFace);
    }, detectionInterval);
  }, [isDetecting, hasFace, onFaceDetected, onFaceLost, detectionInterval]);

  useEffect(() => {
    if (isDetecting) {
      detectFace();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDetecting, detectFace]);

  return {
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    isDetecting,
    hasFace,
    error
  };
}

