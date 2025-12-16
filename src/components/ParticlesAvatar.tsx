'use client';

import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ParticlesAvatarProps {
  started: boolean;
  audioStream?: MediaStream | null;
  speechLevel?: number; // 0..1 (preferred): remote/assistant speech amplitude
}

// Medium-LOD model URL (better detail, still reasonable)
const MODEL_URL =
  'https://models.readyplayer.me/69412bf278f65986cc129c0d.glb?morphTargets=none&textureAtlas=none&lod=1';

function ParticlesModel({ started, audioStream, speechLevel }: ParticlesAvatarProps) {
  const meshRef = useRef<THREE.Points>(null);
  const ambientRef = useRef<THREE.Points>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const pointTags = useRef<Uint8Array | null>(null);
  const mouthBoundsRef = useRef<{
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
    centerY: number;
    centerZ: number;
    pivotY: number;
    pivotZ: number;
    widthX: number;
  } | null>(null);
  const ambientOriginal = useRef<Float32Array | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const assemblyFactor = useRef(0);
  const mouthOpenSmoothed = useRef(0);

  const dotTexture = useMemo(() => {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Solid square for pixel/voxel look
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 2, size - 4, size - 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    return texture;
  }, []);

  // Load low-LOD model
  const { scene } = useGLTF(MODEL_URL);

  // Extract HEAD geometry only
  const geometry = useMemo(() => {
    const MAX_POINTS = 14000;
    const selected: Array<{ attr: THREE.BufferAttribute; name: string; tag: number; count: number }> = [];
    let teethTotal = 0;
    let otherTotal = 0;

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const name = child.name.toLowerCase();
      if (!name.includes('head') && !name.includes('face') && !name.includes('teeth') && !name.includes('eye')) return;

      const mesh = child as THREE.Mesh;
      const attr = mesh.geometry.attributes.position as THREE.BufferAttribute | undefined;
      if (!attr) return;

      const isTeeth = name.includes('teeth');
      const tag = isTeeth ? 1 : 2; // 1=teeth/mouth detail, 2=head/other
      selected.push({ attr, name, tag, count: attr.count });
      if (isTeeth) teethTotal += attr.count;
      else otherTotal += attr.count;
    });

    // Budget points so the mouth has enough detail
    const teethBudget = Math.min(3000, Math.floor(MAX_POINTS * 0.28));
    const otherBudget = Math.max(1000, MAX_POINTS - teethBudget);

    const teethStride = Math.max(1, Math.ceil(teethTotal / teethBudget));
    const otherStride = Math.max(1, Math.ceil(otherTotal / otherBudget));

    const maxPoints = MAX_POINTS;
    const positions = new Float32Array(maxPoints * 3);
    const tags = new Uint8Array(maxPoints);
    let writeFloats = 0;
    let writtenPoints = 0;

    for (const item of selected) {
      const attr = item.attr;
      const stride = item.tag === 1 ? teethStride : otherStride;
      for (let i = 0; i < attr.count; i += stride) {
        if (writeFloats >= positions.length) break;
        positions[writeFloats++] = attr.getX(i);
        positions[writeFloats++] = attr.getY(i);
        positions[writeFloats++] = attr.getZ(i);
        tags[writtenPoints++] = item.tag;
      }
      if (writeFloats >= positions.length) break;
    }

    const trimmed = positions.subarray(0, writeFloats);
    const trimmedTags = tags.subarray(0, Math.floor(writeFloats / 3));

    // Center + scale the head nicely
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity,
      maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;
    for (let i = 0; i < trimmed.length; i += 3) {
      const x = trimmed[i];
      const y = trimmed[i + 1];
      const z = trimmed[i + 2];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;
    const maxSize = Math.max(sizeX, sizeY, sizeZ) || 1;
    const scale = 1 / maxSize;

    const centered = new Float32Array(trimmed.length);
    for (let i = 0; i < trimmed.length; i += 3) {
      // Normalize to roughly unit size
      centered[i] = (trimmed[i] - cx) * scale;
      centered[i + 1] = (trimmed[i + 1] - cy) * scale;
      centered[i + 2] = (trimmed[i + 2] - cz) * scale;
    }

    // Crop: keep MOST of head, only cut the neck and extreme back-of-head.
    // This is intentionally lenient (user feedback: head was over-cut).
    const Y_MIN = -0.22; // cuts most neck, keeps jaw
    const Z_MIN = -0.35; // keep some depth so it doesn't look like a flat mask

    const filtered = new Float32Array(centered.length);
    const filteredTags = new Uint8Array(trimmedTags.length);
    let w = 0;
    let wp = 0;
    for (let p = 0; p < trimmedTags.length; p++) {
      const i = p * 3;
      const x = centered[i];
      const y = centered[i + 1];
      const z = centered[i + 2];
      if (y < Y_MIN) continue;
      if (z < Z_MIN) continue;

      // Voxelize/Grid Snap
      const gridSize = 0.006; // 6mm voxels
      const vx = Math.round(x / gridSize) * gridSize;
      const vy = Math.round(y / gridSize) * gridSize;
      const vz = Math.round(z / gridSize) * gridSize;

      filtered[w++] = vx;
      filtered[w++] = vy;
      filtered[w++] = vz;
      filteredTags[wp++] = trimmedTags[p];
    }

    const final = filtered.subarray(0, w);
    const finalTags = filteredTags.subarray(0, Math.floor(w / 3));

    // Compute mouth/jaw bounds from teeth points (tag=1)
    let tMinX = Infinity,
      tMinY = Infinity,
      tMinZ = Infinity,
      tMaxX = -Infinity,
      tMaxY = -Infinity,
      tMaxZ = -Infinity;
    let teethCount = 0;
    for (let p = 0; p < finalTags.length; p++) {
      if (finalTags[p] !== 1) continue;
      const i = p * 3;
      const x = final[i];
      const y = final[i + 1];
      const z = final[i + 2];
      if (x < tMinX) tMinX = x;
      if (y < tMinY) tMinY = y;
      if (z < tMinZ) tMinZ = z;
      if (x > tMaxX) tMaxX = x;
      if (y > tMaxY) tMaxY = y;
      if (z > tMaxZ) tMaxZ = z;
      teethCount++;
    }

    // Fallback if teeth weren't sampled enough
    if (!Number.isFinite(tMinX) || teethCount < 16) {
      tMinX = -0.08;
      tMaxX = 0.08;
      tMinY = -0.16;
      tMaxY = 0.02;
      tMinZ = 0.02;
      tMaxZ = 0.12;
    }

    const centerY = (tMinY + tMaxY) / 2;
    const centerZ = (tMinZ + tMaxZ) / 2;
    const widthX = Math.max(0.001, tMaxX - tMinX);

    mouthBoundsRef.current = {
      minX: tMinX,
      maxX: tMaxX,
      minY: tMinY,
      maxY: tMaxY,
      minZ: tMinZ,
      maxZ: tMaxZ,
      centerY,
      centerZ,
      // Jaw hinge a bit above the teeth center, slightly behind them
      pivotY: centerY + (tMaxY - tMinY) * 0.18,
      pivotZ: centerZ - (tMaxZ - tMinZ) * 0.20,
      widthX,
    };

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(final, 3));
    originalPositions.current = Float32Array.from(final);
    pointTags.current = Uint8Array.from(finalTags);
    return geo;
  }, [scene]);

  const ambientGeometry = useMemo(() => {
    const AMBIENT_COUNT = 1600;
    const positions = new Float32Array(AMBIENT_COUNT * 3);
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const i3 = i * 3;
      // random direction
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      // shell radius around the face
      const r = 0.7 + Math.random() * 0.9;
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = (r * Math.sin(phi) * Math.sin(theta)) * 0.9;
      positions[i3 + 2] = r * Math.cos(phi);
    }
    ambientOriginal.current = Float32Array.from(positions);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Setup Audio Analyser
  useEffect(() => {
    if (!audioStream) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyser);
    
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));

    return () => {
      audioContext.close();
    };
  }, [audioStream]);

  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      ambientGeometry.dispose();
    };
  }, [geometry, ambientGeometry]);

  useFrame((state) => {
    if (!meshRef.current || !originalPositions.current) return;
    
    const posAttr = meshRef.current.geometry.getAttribute('position');
    if (!posAttr || !posAttr.array) return;
    
    const array = posAttr.array as Float32Array;
    const original = originalPositions.current;
    const tags = pointTags.current;
    const mouth = mouthBoundsRef.current;
    const t = state.clock.elapsedTime;
    const pointCount = original.length / 3;

    // Assembly animation
    const target = started ? 1 : 0;
    assemblyFactor.current = THREE.MathUtils.lerp(assemblyFactor.current, target, 0.02);
    const assembled = assemblyFactor.current;

    // Lipsync
    // 1) Prefer externally provided speech level (e.g., Vapi 'volume-level')
    // 2) Fallback to mic analyser if available
    let mouthOpen = 0;
    if (typeof speechLevel === 'number' && Number.isFinite(speechLevel)) {
      const v = THREE.MathUtils.clamp(speechLevel, 0, 1);
      mouthOpen = v * 0.22;
    } else if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      let sum = 0;
      for (let i = 0; i < 20; i++) sum += dataArrayRef.current[i];
      mouthOpen = (sum / 20 / 255) * 0.2;
    }

    // Smooth to avoid jitter
    mouthOpenSmoothed.current = THREE.MathUtils.lerp(mouthOpenSmoothed.current, mouthOpen, 0.22);
    const open = mouthOpenSmoothed.current;

    // Update each point
    for (let i = 0; i < pointCount; i++) {
      const i3 = i * 3;
      const ox = original[i3];
      const oy = original[i3 + 1];
      const oz = original[i3 + 2];

      // Dispersed state: floating noise
      // Digital disintegration effect
      const baseNoise = 0.004; 
      const noiseAmp = 0.8 * (1 - assembled) + baseNoise;
      
      // Removed high-frequency jitter to stop "vibrating" look
      // Instead, use a slow digital wave
      const wave = Math.sin(t * 2.0 + oy * 5.0) * 0.002;
      
      const nx = Math.sin(t * 0.5 + i * 0.05) * noiseAmp + wave;
      const ny = Math.cos(t * 0.3 + i * 0.07) * noiseAmp;
      const nz = Math.sin(t * 0.4 + i * 0.06) * noiseAmp;

      // Lipsync: Smooth opening based on geometry
      let x = ox;
      let y = oy;
      let z = oz;

      if (assembled > 0.55 && tags && mouth) {
        const tag = tags[i] ?? 2;
        
        // 1. Global subtle head pulse (breathing)
        const breathe = open * 0.005 * Math.sin(t * 8);
        x += ox * breathe;
        y += oy * breathe;
        z += oz * breathe;

        // 2. Mouth Opening Logic
        const centerX = (mouth.minX + mouth.maxX) / 2;
        const centerY = mouth.centerY;
        
        const dx = ox - centerX;
        const dy = oy - centerY;
        
        // Gaussian falloff for skin stretching
        // Controls how "wide" the moving area is
        const w = Math.exp(-(dx*dx * 500 + dy*dy * 700));

        if (tag === 1) {
          // TEETH: Rigid movement
          // Lower teeth (below center) move down with jaw
          // Upper teeth stay fixed
          if (dy < 0) {
             // Lower teeth
             y -= open * 0.06; // Move down
             z -= open * 0.01; // Jaw rotates back slightly
          }
        } else {
          // SKIN/LIPS: Elastic deformation
          if (w > 0.02) {
             // Determine if upper or lower lip
             const isUpper = dy > 0;
             const dir = isUpper ? 1 : -1;
             // Lower lip moves more than upper lip
             const factor = isUpper ? 0.3 : 0.8; 
             
             // Open lips
             y += dir * open * w * 0.1 * factor;
             
             // Pucker/Forward movement to give volume
             z += open * w * 0.025;
          }
        }
      }

      array[i3] = x + nx;
      array[i3 + 1] = y + ny;
      array[i3 + 2] = z + nz;
    }

    posAttr.needsUpdate = true;
    
    // Subtle rotation when assembled
    meshRef.current.rotation.y = Math.sin(t * 0.2) * 0.1 * assembled;

    // Ambient particles drifting around the face
    if (ambientRef.current && ambientOriginal.current) {
      const aAttr = ambientRef.current.geometry.getAttribute('position');
      if (aAttr && aAttr.array) {
        const aArr = aAttr.array as Float32Array;
        const aOrig = ambientOriginal.current;
        const aCount = aOrig.length / 3;
        for (let i = 0; i < aCount; i++) {
          const i3 = i * 3;
          const ox = aOrig[i3];
          const oy = aOrig[i3 + 1];
          const oz = aOrig[i3 + 2];
          const drift = 0.04;
          aArr[i3] = ox + Math.sin(t * 0.35 + i * 0.03) * drift;
          aArr[i3 + 1] = oy + Math.cos(t * 0.28 + i * 0.02) * drift;
          aArr[i3 + 2] = oz + Math.sin(t * 0.32 + i * 0.025) * drift;
        }
        aAttr.needsUpdate = true;
        ambientRef.current.rotation.y = -Math.sin(t * 0.12) * 0.06;
      }
    }
  });

  return (
    <group position={[0, -0.1, 0]}>
      <points ref={ambientRef} geometry={ambientGeometry}>
        <pointsMaterial
          size={0.007}
          color="#ffffff"
          map={dotTexture ?? undefined}
          alphaMap={dotTexture ?? undefined}
          sizeAttenuation
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points ref={meshRef} geometry={geometry}>
        <pointsMaterial 
          size={0.018}
          color="#ffffff"
          map={dotTexture ?? undefined}
          alphaMap={dotTexture ?? undefined}
          sizeAttenuation 
          transparent 
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshBasicMaterial color="#6366f1" wireframe />
    </mesh>
  );
}

export default function ParticlesAvatar({ started, audioStream, speechLevel }: ParticlesAvatarProps) {
  return (
    <div className="w-full h-full">
      <Canvas 
        camera={{ position: [0, 0, 1.4], fov: 42 }}
        gl={{ antialias: false, powerPreference: 'low-power' }}
        dpr={1}
      >
        <color attach="background" args={['#000']} />
        <Suspense fallback={<LoadingFallback />}>
          <ParticlesModel started={started} audioStream={audioStream} speechLevel={speechLevel} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload(MODEL_URL);
