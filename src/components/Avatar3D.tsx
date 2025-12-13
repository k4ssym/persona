'use client';

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  url: string;
  isSpeaking: boolean;
  volume: number;
}

function Model({ url, isSpeaking, volume }: ModelProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const headMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  
  useEffect(() => {
    // Find head mesh for lip sync (только один раз при загрузке)
    scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        if (child.name.includes('Wolf3D_Head') || child.name.includes('Head')) {
          headMeshRef.current = child;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Subtle idle animation
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(time * 0.8) * 0.002;
      groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.01;
    }

    // Lip sync - realistic with multiple visemes
    if (headMeshRef.current?.morphTargetInfluences && headMeshRef.current?.morphTargetDictionary) {
      const dict = headMeshRef.current.morphTargetDictionary;
      const influences = headMeshRef.current.morphTargetInfluences;
      
      if (isSpeaking) {
        // Volume-driven lip sync (реагирует на реальную громкость)
        const v = Math.min(1, volume * 1.5); // Усиливаем volume
        
        // Основное открытие рта по громкости
        const mouthOpenAmount = v * 0.7;
        
        // Добавляем вариацию формы рта
        const variation = Math.sin(time * 10) * 0.5 + 0.5;
        
        // Jaw и mouth открываются по громкости
        if (dict['jawOpen'] !== undefined) {
          const target = mouthOpenAmount;
          influences[dict['jawOpen']] += (target - influences[dict['jawOpen']]) * 0.5;
        }
        if (dict['mouthOpen'] !== undefined) {
          const target = mouthOpenAmount * 0.8;
          influences[dict['mouthOpen']] += (target - influences[dict['mouthOpen']]) * 0.5;
        }
        
        // Разные visemes по громкости + вариации
        if (dict['viseme_aa'] !== undefined) {
          influences[dict['viseme_aa']] += (v * variation * 0.6 - influences[dict['viseme_aa']]) * 0.4;
        }
        if (dict['viseme_O'] !== undefined) {
          influences[dict['viseme_O']] += (v * (1 - variation) * 0.5 - influences[dict['viseme_O']]) * 0.4;
        }
        if (dict['viseme_E'] !== undefined) {
          influences[dict['viseme_E']] += (v * variation * 0.3 - influences[dict['viseme_E']]) * 0.3;
        }
        
        // Лёгкое движение бровей
        if (dict['browInnerUp'] !== undefined) {
          influences[dict['browInnerUp']] = v * 0.1;
        }
        
      } else {
        // Smooth fade out all mouth shapes
        Object.keys(dict).forEach(key => {
          if (key.includes('mouth') || key.includes('viseme') || key.includes('jaw') || key.includes('brow')) {
            if (influences[dict[key]] > 0.01) {
              influences[dict[key]] *= 0.9;
            } else {
              influences[dict[key]] = 0;
            }
          }
        });
        
        // Idle subtle smile
        ['mouthSmileLeft', 'mouthSmileRight'].forEach(t => {
          if (dict[t] !== undefined) {
            const target = 0.05 + Math.sin(time * 0.5) * 0.03;
            influences[dict[t]] += (target - influences[dict[t]]) * 0.1;
          }
        });
      }
      
      // Natural blinking - каждые 2.5 секунды
      const blinkCycle = time % 2.5;
      let blink = 0;
      if (blinkCycle > 2.3) {
        blink = Math.sin((blinkCycle - 2.3) * Math.PI / 0.2);
      }
      
      // Пробуем ВСЕ возможные названия для моргания
      const blinkTargets = [
        'eyeBlinkLeft', 'eyeBlinkRight', 
        'eyesClosed', 'eyesClose',
        'EyeBlink_L', 'EyeBlink_R',
        'blink', 'Blink',
        'eye_close_L', 'eye_close_R'
      ];
      
      blinkTargets.forEach(t => {
        if (dict[t] !== undefined) {
          influences[dict[t]] = blink;
        }
      });
      
      // Subtle eye movement
      if (dict['eyeLookUpLeft'] !== undefined) {
        influences[dict['eyeLookUpLeft']] = Math.sin(time * 0.3) * 0.05 + 0.05;
      }
      if (dict['eyeLookUpRight'] !== undefined) {
        influences[dict['eyeLookUpRight']] = Math.sin(time * 0.3) * 0.05 + 0.05;
      }
    }
    
    // Также пробуем моргание на ВСЕХ мешах сцены (для глаз которые отдельные меши)
    scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
        const d = child.morphTargetDictionary;
        const inf = child.morphTargetInfluences;
        const blinkCycle = time % 2.5;
        const blinkVal = blinkCycle > 2.3 ? Math.sin((blinkCycle - 2.3) * Math.PI / 0.2) : 0;
        
        Object.keys(d).forEach(key => {
          const k = key.toLowerCase();
          if ((k.includes('blink') || k.includes('close') || k.includes('closed')) && k.includes('eye')) {
            inf[d[key]] = blinkVal;
          }
        });
      }
    });
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function Loader() {
  return (
    <mesh position={[0, 1.6, 0]}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color="#8b5cf6" wireframe />
    </mesh>
  );
}

interface Avatar3DProps {
  avatarUrl: string;
  isSpeaking: boolean;
  isListening: boolean;
  isActive: boolean;
  volume?: number;
}

export default function Avatar3D({ avatarUrl, isSpeaking, isListening, isActive, volume = 0 }: Avatar3DProps) {
  const glowColor = isListening ? '#22c55e' : isSpeaking ? '#3b82f6' : '#8b5cf6';
  
  return (
    <div className="fixed inset-0 z-0">
      {/* Glow */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-700"
        style={{ background: glowColor, opacity: isActive ? 0.35 : 0.15 }}
      />
      
      <Canvas gl={{ antialias: true, alpha: true }}>
        {/* Camera will be auto-positioned by Model component */}
        <PerspectiveCamera makeDefault position={[0, 1.57, 2.0]} fov={17} />
        
        <ambientLight intensity={1.2} />
        <directionalLight position={[2, 3, 2]} intensity={1.5} />
        <directionalLight position={[-2, 2, -1]} intensity={0.5} />
        <pointLight position={[0, 2, 1]} intensity={0.5} color={glowColor} />
        
        <Suspense fallback={<Loader />}>
          <Model url={avatarUrl} isSpeaking={isSpeaking} volume={volume} />
        </Suspense>
      </Canvas>
    </div>
  );
}
