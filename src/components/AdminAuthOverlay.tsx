'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAuthOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + A
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correct = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin2024';
    if (password === correct) {
      sessionStorage.setItem('admin_auth', 'true');
      setIsOpen(false);
      router.push('/admin');
    } else {
      alert('Неверный пароль');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 50, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'rgba(0,0,0,0.9)',
      fontFamily: "'Courier New', monospace"
    }}>
      <div style={{ 
        backgroundColor: 'black', 
        padding: '2rem', 
        border: '2px solid white', 
        width: '24rem', 
        position: 'relative'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '-0.75rem', 
          left: '1rem', 
          backgroundColor: 'black', 
          padding: '0 0.5rem', 
          fontWeight: 'bold', 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em',
          color: 'white'
        }}>
          System Override
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>Security Key_</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                backgroundColor: 'black', 
                border: 'none', 
                borderBottom: '2px solid rgba(255,255,255,0.5)', 
                padding: '0.5rem', 
                color: 'white', 
                outline: 'none', 
                fontFamily: "'Courier New', monospace", 
                fontSize: '1.25rem' 
              }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'rgba(255,255,255,0.5)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em', 
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              [ Abort ]
            </button>
            <button
              type="submit"
              style={{ 
                backgroundColor: 'white', 
                color: 'black', 
                padding: '0.75rem 1.5rem', 
                fontWeight: 'bold', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em', 
                border: 'none', 
                cursor: 'pointer' 
              }}
            >
              [ Access ]
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
