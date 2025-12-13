'use client';

import { useEffect, useState } from 'react';
import { logger, ConversationLog } from '@/lib/logger';
import Link from 'next/link';

// Пароль для админки (можно поменять)
const ADMIN_PASSWORD = 'admin2024';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const [stats, setStats] = useState({ totalConversations: 0, totalMessages: 0, averageDuration: 0, today: 0 });
  const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null);

  useEffect(() => {
    // Check if already authenticated
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setError('');
      loadData();
    } else {
      setError('Неверный пароль');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
  };

  const loadData = () => {
    setLogs(logger.getLogs());
    setStats(logger.getStats());
  };

  const clearAllLogs = () => {
    if (confirm('Удалить все логи?')) {
      logger.clearLogs();
      loadData();
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}м ${secs}с` : `${secs}с`;
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #1e1b4b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '48px',
          border: '1px solid rgba(255,255,255,0.1)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: 'white',
            marginBottom: '8px'
          }}>Админ панель</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>
            Введите пароль для доступа
          </p>
          
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '16px',
                background: 'rgba(0,0,0,0.3)',
                border: error ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                marginBottom: '16px'
              }}
            />
            {error && (
              <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
            )}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 10px 40px rgba(147, 51, 234, 0.3)'
              }}
            >
              Войти
            </button>
          </form>
          
          <Link 
            href="/"
            style={{
              display: 'inline-block',
              marginTop: '24px',
              color: 'rgba(255,255,255,0.4)',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ← Вернуться на главную
          </Link>
        </div>
      </main>
    );
  }

  // Admin panel
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #1e1b4b 100%)',
      color: 'white',
      padding: '40px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Админ панель
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Панель управления</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleLogout}
              style={{
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                fontSize: '14px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Выйти
            </button>
            <Link 
              href="/"
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                textDecoration: 'none',
                color: 'white',
                boxShadow: '0 10px 40px rgba(147, 51, 234, 0.3)'
              }}
            >
              ← Вернуться
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '8px' }}>Всего разговоров</p>
            <p style={{ fontSize: '40px', fontWeight: 'bold' }}>{stats.totalConversations}</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))', borderRadius: '16px', padding: '24px', border: '1px solid rgba(34,197,94,0.2)' }}>
            <p style={{ color: 'rgba(34,197,94,0.7)', fontSize: '14px', marginBottom: '8px' }}>Сегодня</p>
            <p style={{ fontSize: '40px', fontWeight: 'bold', color: '#22c55e' }}>{stats.today}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '8px' }}>Всего сообщений</p>
            <p style={{ fontSize: '40px', fontWeight: 'bold', color: '#60a5fa' }}>{stats.totalMessages}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '8px' }}>Ср. длительность</p>
            <p style={{ fontSize: '40px', fontWeight: 'bold', color: '#a78bfa' }}>{formatDuration(stats.averageDuration)}</p>
          </div>
        </div>

        {/* Logs Section */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>📋 История разговоров</h2>
            <button 
              onClick={clearAllLogs}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                color: '#f87171',
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🗑 Очистить
            </button>
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>Пока нет записей</p>
            </div>
          ) : (
            <div>
              {logs.slice().reverse().map((log, index) => (
                <div 
                  key={log.id}
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    borderBottom: index < logs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                        width: '48px', height: '48px', borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px'
                      }}>💬</div>
                      <div>
                        <p style={{ fontWeight: '500' }}>{formatDate(log.startTime)}</p>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                          {log.messages.length} сообщений • {formatDuration(log.duration || 0)}
                        </p>
                      </div>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.3)', transform: selectedLog?.id === log.id ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </div>

                  {selectedLog?.id === log.id && log.messages.length > 0 && (
                    <div style={{ marginTop: '20px', paddingLeft: '64px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {log.messages.map((msg, i) => (
                        <div 
                          key={i}
                          style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: msg.role === 'user' ? 'rgba(59,130,246,0.1)' : 'rgba(147,51,234,0.1)',
                            border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'rgba(147,51,234,0.2)'}`
                          }}
                        >
                          <p style={{ fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: msg.role === 'user' ? '#60a5fa' : '#a78bfa' }}>
                            {msg.role === 'user' ? '👤 Посетитель' : '🤖 Ассистент'}
                          </p>
                          <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>⚙️ Настройки</h2>
          </div>
          
          {[
            { label: 'Vapi Public Key', desc: 'API ключ', value: 'e10e6537-c43f...', color: '#a78bfa' },
            { label: '3D Аватар', desc: 'Ready Player Me', value: '693d88c9...', color: '#60a5fa' },
            { label: 'Голос', desc: 'ElevenLabs multilingual v2', status: true },
            { label: 'STT', desc: 'Deepgram Nova-2, RU', status: true },
            { label: 'LLM', desc: 'GPT-4o-mini', status: true },
          ].map((item, i) => (
            <div key={i} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none'
            }}>
              <div>
                <p style={{ fontWeight: '500' }}>{item.label}</p>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
              </div>
              {item.value ? (
                <code style={{ fontSize: '14px', background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '8px', color: item.color }}>{item.value}</code>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '8px 16px', borderRadius: '8px' }}>
                  <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }}></span>
                  Активен
                </span>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
          Виртуальный ресепшн • Powered by Vapi.ai
        </div>
      </div>
    </main>
  );
}
