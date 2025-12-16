'use client';

import { useEffect, useRef, useState } from 'react';
import { logger, ConversationLog } from '@/lib/logger';
import Link from 'next/link';
import PresenceDetector from '@/components/PresenceDetector';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

// Пароль для админки
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin2024';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'settings' | 'prompt'>('dashboard');

  // Data
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    averageDuration: 0,
    today: 0,
    resolutionRate: 0,
    avgLatency: 0,
    totalTokens: 0
  });

  // Chart Data
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null);

  // Settings
  const [prompt, setPrompt] = useState('');
  const [sensitivity, setSensitivity] = useState(20);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [autoStart, setAutoStart] = useState(true);
  const [assistantLanguage, setAssistantLanguage] = useState<'ru' | 'en'>('ru');
  const [assistantVoiceGender, setAssistantVoiceGender] = useState<'female' | 'male'>('female');
  const [assistantModel, setAssistantModel] = useState<string>('gpt-4o-mini');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [promptFileName, setPromptFileName] = useState<string>('');
  const [promptFileError, setPromptFileError] = useState<string>('');

  type CameraZone = { x: number; y: number; w: number; h: number };
  const DEFAULT_ZONE: CameraZone = { x: 25, y: 20, w: 50, h: 60 };
  const [cameraZone, setCameraZone] = useState<CameraZone>(DEFAULT_ZONE);

  const feedRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<
    | null
    | {
      kind: 'move' | 'resize';
      handle?: 'nw' | 'ne' | 'sw' | 'se';
      startClientX: number;
      startClientY: number;
      startZone: CameraZone;
      rect: DOMRect;
      pointerId: number;
    }
  >(null);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadData();
      loadSettings();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setError('');
      loadData();
      loadSettings();
    } else {
      setError('INVALID PASSWORD');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
  };

  const loadData = async () => {
    const loadedLogs = await logger.getLogs();
    setLogs(loadedLogs);

    // --- Stats Calculation ---
    const totalConversations = loadedLogs.length;
    const totalMessages = loadedLogs.reduce((acc, log) => acc + log.messages.length, 0);
    const totalDuration = loadedLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
    const averageDuration = totalConversations > 0 ? totalDuration / totalConversations : 0;

    // Resolution Rate (Mock logic if empty, otherwise real)
    const resolvedCount = loadedLogs.filter(l => l.resolutionStatus === 'resolved').length;
    // If no explicit 'resolved' status found in any log, treat duration > 10s as resolved for demo
    const effectiveResolved = resolvedCount > 0
      ? resolvedCount
      : loadedLogs.filter(l => (l.duration || 0) > 10).length;

    const resolutionRate = totalConversations > 0 ? (effectiveResolved / totalConversations) * 100 : 0;

    // Latency
    const latencySum = loadedLogs.reduce((acc, l) => acc + (l.latency || 0), 0);
    // If no latency data, mock it for demo based on duration/messages
    const hasRealLatency = loadedLogs.some(l => l.latency && l.latency > 0);
    const avgLatency = hasRealLatency
      ? latencySum / loadedLogs.filter(l => l.latency).length
      : 0; // Default to 0 or mock if preferred

    // Tokens
    const totalTokens = loadedLogs.reduce((acc, l) => acc + (l.tokensUsed || 0), 0);

    const today = new Date().toDateString();
    const todayCount = loadedLogs.filter(log => new Date(log.startTime).toDateString() === today).length;

    setStats({
      totalConversations,
      totalMessages,
      averageDuration,
      today: todayCount,
      resolutionRate,
      avgLatency,
      totalTokens
    });

    // --- Chart Data Processing ---

    // Timeline (Daily) - Last 14 days
    const dailyMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyMap.set(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 0);
    }
    loadedLogs.forEach(log => {
      const d = new Date(log.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyMap.has(d)) {
        dailyMap.set(d, (dailyMap.get(d) || 0) + 1);
      }
    });
    setTimelineData(Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count })));

    // Weekly (Basic grouping by Monday)
    const weekMap = new Map<string, number>();
    loadedLogs.forEach(log => {
      const d = new Date(log.startTime);
      // Find Monday
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const key = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      weekMap.set(key, (weekMap.get(key) || 0) + 1);
    });
    // Sort roughly
    setWeeklyData(Array.from(weekMap.entries()).map(([week, count]) => ({ week, count })).slice(-5));

    // Monthly
    const monthMap = new Map<string, number>();
    loadedLogs.forEach(log => {
      const key = new Date(log.startTime).toLocaleDateString('en-US', { month: 'short' });
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    });
    setMonthlyData(Array.from(monthMap.entries()).map(([month, count]) => ({ month, count })));
  };

  const loadSettings = () => {
    const savedPrompt = localStorage.getItem('assistant_prompt');
    if (savedPrompt) setPrompt(savedPrompt);

    const savedSens = localStorage.getItem('camera_sensitivity');
    if (savedSens) setSensitivity(Number(savedSens));

    const savedSubs = localStorage.getItem('show_subtitles');
    if (savedSubs !== null) setShowSubtitles(savedSubs === 'true');

    const savedAuto = localStorage.getItem('auto_start');
    if (savedAuto !== null) setAutoStart(savedAuto === 'true');

    const savedLang = localStorage.getItem('assistant_language');
    if (savedLang === 'ru' || savedLang === 'en') setAssistantLanguage(savedLang);

    const savedGender = localStorage.getItem('assistant_voice_gender');
    if (savedGender === 'female' || savedGender === 'male') setAssistantVoiceGender(savedGender);

    const savedModel = localStorage.getItem('assistant_llm_model');
    if (savedModel && typeof savedModel === 'string') setAssistantModel(savedModel);

    const savedZone = localStorage.getItem('camera_active_zone');
    if (savedZone) {
      try {
        const parsed = JSON.parse(savedZone);
        const x = Number(parsed?.x);
        const y = Number(parsed?.y);
        const w = Number(parsed?.w);
        const h = Number(parsed?.h);
        if ([x, y, w, h].every(Number.isFinite)) {
          setCameraZone({
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
            w: Math.max(5, Math.min(100, w)),
            h: Math.max(5, Math.min(100, h)),
          });
        }
      } catch {
        // ignore
      }
    }
  };

  const saveSettings = () => {
    localStorage.setItem('assistant_prompt', prompt);
    localStorage.setItem('camera_sensitivity', sensitivity.toString());
    localStorage.setItem('show_subtitles', showSubtitles.toString());
    localStorage.setItem('auto_start', autoStart.toString());
    localStorage.setItem('camera_active_zone', JSON.stringify(cameraZone));
    localStorage.setItem('assistant_language', assistantLanguage);
    localStorage.setItem('assistant_voice_gender', assistantVoiceGender);
    localStorage.setItem('assistant_llm_model', assistantModel);

    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.readAsText(file);
    });
  };

  const onPromptFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPromptFileError('');
    setPromptFileName(file.name);

    try {
      const raw = await readFileAsText(file);
      const ext = (file.name.split('.').pop() || '').toLowerCase();

      if (ext === 'json') {
        try {
          const parsed = JSON.parse(raw);

          const asTextContent = (content: any): string | null => {
            if (typeof content === 'string') return content;
            // Some SDKs represent content as structured blocks: [{ type: 'text', text: '...' }]
            if (Array.isArray(content)) {
              const parts = content
                .map((c) => (typeof c?.text === 'string' ? c.text : typeof c === 'string' ? c : ''))
                .map((s) => String(s).trim())
                .filter(Boolean);
              return parts.length ? parts.join('\n') : null;
            }
            if (content && typeof content === 'object' && typeof (content as any).text === 'string') return (content as any).text;
            return null;
          };

          const findSystemFromMessages = (messages: any): string | null => {
            if (!Array.isArray(messages)) return null;
            for (const msg of messages) {
              if (!msg || typeof msg !== 'object') continue;
              if (String((msg as any).role || '').toLowerCase() !== 'system') continue;
              const content = asTextContent((msg as any).content);
              if (content && content.trim()) return content;
            }
            return null;
          };

          const extracted =
            typeof parsed?.systemPrompt === 'string'
              ? parsed.systemPrompt
              : typeof parsed?.prompt === 'string'
                ? parsed.prompt
                : findSystemFromMessages(parsed?.messages) ||
                findSystemFromMessages(parsed?.model?.messages) ||
                findSystemFromMessages(parsed?.assistant?.model?.messages) ||
                null;

          if (extracted && extracted.trim()) setPrompt(extracted);
          else setPrompt(JSON.stringify(parsed, null, 2));
        } catch {
          // If JSON parse fails, treat it as plain text.
          setPrompt(raw);
        }
      } else {
        // .txt, .csv, or anything else: treat as plain text.
        setPrompt(raw);
      }
    } catch {
      setPromptFileError('Failed to read file');
    } finally {
      // Allow selecting the same file again
      e.target.value = '';
    }
  };

  const normalizeZone = (zone: CameraZone): CameraZone => {
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const w = clamp(zone.w, 5, 100);
    const h = clamp(zone.h, 5, 100);
    const x = clamp(zone.x, 0, 100 - w);
    const y = clamp(zone.y, 0, 100 - h);
    return { x, y, w, h };
  };

  const updateZone = (partial: Partial<CameraZone>) => {
    setCameraZone((prev) => normalizeZone({ ...prev, ...partial }));
  };

  const onZonePointerDown = (
    e: React.PointerEvent,
    kind: 'move' | 'resize',
    handle?: 'nw' | 'ne' | 'sw' | 'se'
  ) => {
    const el = feedRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      kind,
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startZone: cameraZone,
      rect,
      pointerId: e.pointerId,
    };
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    e.preventDefault();
    e.stopPropagation();
  };

  const onZonePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (e.pointerId !== drag.pointerId) return;

    const dxPct = ((e.clientX - drag.startClientX) / drag.rect.width) * 100;
    const dyPct = ((e.clientY - drag.startClientY) / drag.rect.height) * 100;

    if (drag.kind === 'move') {
      setCameraZone(normalizeZone({
        x: drag.startZone.x + dxPct,
        y: drag.startZone.y + dyPct,
        w: drag.startZone.w,
        h: drag.startZone.h,
      }));
      return;
    }

    const z = { ...drag.startZone };
    const h = drag.handle;
    if (!h) return;

    if (h === 'nw') {
      z.x = drag.startZone.x + dxPct;
      z.y = drag.startZone.y + dyPct;
      z.w = drag.startZone.w - dxPct;
      z.h = drag.startZone.h - dyPct;
    } else if (h === 'ne') {
      z.y = drag.startZone.y + dyPct;
      z.w = drag.startZone.w + dxPct;
      z.h = drag.startZone.h - dyPct;
    } else if (h === 'sw') {
      z.x = drag.startZone.x + dxPct;
      z.w = drag.startZone.w - dxPct;
      z.h = drag.startZone.h + dyPct;
    } else if (h === 'se') {
      z.w = drag.startZone.w + dxPct;
      z.h = drag.startZone.h + dyPct;
    }

    setCameraZone(normalizeZone(z));
    e.preventDefault();
  };

  const onZonePointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (e.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const clearAllLogs = () => {
    setShowDeleteConfirm(true);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<'full' | 'timeline'>('full');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const [logFilter, setLogFilter] = useState<'all' | 'resolved' | 'unresolved'>('all');

  const confirmDelete = async () => {
    if (deletePassword === ADMIN_PASSWORD) {
      await logger.clearLogs();
      loadData();
      setShowDeleteConfirm(false);
      setDeletePassword('');
      setDeleteError('');
    } else {
      setDeleteError('INVALID PASSWORD');
    }
  };

  const exportToCSV = () => {
    let filteredLogs = logs;

    if (exportPeriod === 'timeline' && exportStartDate && exportEndDate) {
      const start = new Date(exportStartDate).getTime();
      const end = new Date(exportEndDate).getTime();
      filteredLogs = logs.filter(log => {
        const logTime = new Date(log.startTime).getTime();
        return logTime >= start && logTime <= end;
      });
    }

    const csvRows = [];
    csvRows.push(['ID', 'Start Time', 'End Time', 'Duration (s)', 'Messages', 'Tokens Used', 'Latency (ms)', 'Resolution Status', 'Cost'].join(','));

    filteredLogs.forEach(log => {
      csvRows.push([
        log.id,
        log.startTime,
        log.endTime || 'N/A',
        log.duration || 0,
        log.messages.length,
        log.tokensUsed || 0,
        log.latency || 0,
        log.resolutionStatus || 'neutral',
        log.cost || 0
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversations_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const getExportPreviewCount = () => {
    if (exportPeriod === 'full') return logs.length;
    if (exportStartDate && exportEndDate) {
      const start = new Date(exportStartDate).getTime();
      const end = new Date(exportEndDate).getTime();
      return logs.filter(log => {
        const logTime = new Date(log.startTime).getTime();
        return logTime >= start && logTime <= end;
      }).length;
    }
    return 0;
  };

  const getFilteredLogs = () => {
    let filtered = logs;

    // Apply status filter
    if (logFilter === 'resolved') filtered = filtered.filter(l => l.resolutionStatus === 'resolved');
    if (logFilter === 'unresolved') filtered = filtered.filter(l => l.resolutionStatus === 'unresolved');

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => {
        // Search in messages
        const messagesMatch = log.messages.some(m => m.text.toLowerCase().includes(query));
        // Search in ID
        const idMatch = log.id.toLowerCase().includes(query);
        // Search in date
        const dateMatch = log.startTime.toLowerCase().includes(query);
        return messagesMatch || idMatch || dateMatch;
      });
    }

    return filtered;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Login Screen (Terminal Style)
  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', monospace", padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: '28rem', border: '2px solid white', padding: '2rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-0.75rem', left: '1rem', backgroundColor: 'black', padding: '0 0.5rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Access</div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>Password_</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ backgroundColor: 'black', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.5)', padding: '0.5rem', color: 'white', outline: 'none', fontFamily: "'Courier New', monospace", fontSize: '1.25rem' }}
                autoFocus
              />
            </div>

            {error && <div style={{ backgroundColor: 'rgba(127,29,29,0.2)', border: '1px solid rgb(239,68,68)', color: 'rgb(239,68,68)', padding: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>Access Denied: {error}</div>}

            <button
              type="submit"
              style={{ backgroundColor: 'white', color: 'black', padding: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '1rem', cursor: 'pointer', border: 'none' }}
            >
              [ Authenticate ]
            </button>
          </form>

          <Link href="/" style={{ display: 'block', marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
            &lt; Return to Kiosk
          </Link>
        </div>
      </main>
    );
  }

  // Admin Dashboard (Terminal Style)
  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white', fontFamily: "'Courier New', monospace", display: 'flex', flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: '18rem', borderRight: '2px solid rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', backgroundColor: 'black', zIndex: 10 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1, margin: 0 }}>Admin<br />Console</h1>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem', textTransform: 'uppercase' }}>v1.0.4 // SUPERUSER</div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.75rem 0', gap: 0 }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'logs', label: 'System Logs' },
            { id: 'settings', label: 'Configuration' },
            { id: 'prompt', label: 'AI Protocol' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              style={{
                textAlign: 'left',
                padding: '0.85rem 1.5rem',
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                letterSpacing: '0.1em',
                backgroundColor: activeTab === item.id ? 'white' : 'transparent',
                color: activeTab === item.id ? 'black' : 'rgba(255,255,255,0.6)',
                fontWeight: activeTab === item.id ? 'bold' : 'normal',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {activeTab === item.id ? '> ' : ''}{item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
            [ Open Kiosk Display ]
          </Link>
          <button onClick={handleLogout} style={{ fontSize: '0.75rem', color: 'rgb(239,68,68)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            [ Terminate Session ]
          </button>
        </div>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, padding: '3rem', overflowY: 'auto', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', fontSize: '10px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
          System Status: ONLINE
        </div>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ maxWidth: '56rem' }}>
            {/* Existing Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
              <div style={{ border: '2px solid white', padding: '1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.75rem', left: '1rem', backgroundColor: 'black', padding: '0 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>Total Conversations</div>
                <p style={{ fontSize: '4.5rem', fontWeight: 'bold', marginTop: '0.5rem', margin: 0 }}>{stats.totalConversations}</p>
              </div>
              <div style={{ border: '2px solid white', padding: '1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.75rem', left: '1rem', backgroundColor: 'black', padding: '0 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>Today's Activity</div>
                <p style={{ fontSize: '4.5rem', fontWeight: 'bold', marginTop: '0.5rem', margin: 0 }}>{stats.today}</p>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.4)', padding: '1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', left: '1rem', backgroundColor: 'black', padding: '0 0.5rem', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>Total Messages</div>
                <p style={{ fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', margin: 0 }}>{stats.totalMessages}</p>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.4)', padding: '1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', left: '1rem', backgroundColor: 'black', padding: '0 0.5rem', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>Avg Duration</div>
                <p style={{ fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', margin: 0 }}>{stats.averageDuration.toFixed(2)}s</p>
              </div>
            </div>

            {/* New Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginTop: '2rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.4)', padding: '1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', left: '1rem', backgroundColor: 'black', padding: '0 0.5rem', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>Resolution Rate</div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', margin: 0 }}>{stats.resolutionRate.toFixed(1)}%</p>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.4)', padding: '1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', left: '1rem', backgroundColor: 'black', padding: '0 0.5rem', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>Avg Latency</div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', margin: 0 }}>{stats.avgLatency.toFixed(0)}ms</p>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.4)', padding: '1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', left: '1rem', backgroundColor: 'black', padding: '0 0.5rem', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>Tokens Used</div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', margin: 0 }}>{stats.totalTokens.toLocaleString()}</p>
              </div>
            </div>

            {/* Timeline Chart */}
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem' }}>Conversation Timeline</h3>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                    <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'black', borderColor: 'white', color: 'white' }}
                      itemStyle={{ color: 'white' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#fff" strokeWidth={2} dot={{ fill: 'white' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly & Monthly Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem', paddingBottom: '3rem' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem' }}>Weekly Activity</h3>
                <div style={{ height: '200px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                      <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'black', borderColor: 'white', color: 'white' }}
                        itemStyle={{ color: 'white' }}
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                      />
                      <Bar dataKey="count" fill="white" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem' }}>Monthly Overview</h3>
                <div style={{ height: '200px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                      <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'black', borderColor: 'white', color: 'white' }}
                        itemStyle={{ color: 'white' }}
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                      />
                      <Bar dataKey="count" fill="white" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOGS */}
        {activeTab === 'logs' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: '64rem' }}>
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>System Logs</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setShowExportModal(true)} style={{ fontSize: '0.75rem', color: 'white', border: '1px solid white', padding: '0.5rem 1rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', cursor: 'pointer' }}>
                    [ Export CSV ]
                  </button>
                  <button onClick={clearAllLogs} style={{ fontSize: '0.75rem', color: 'rgb(239,68,68)', border: '1px solid rgb(239,68,68)', padding: '0.5rem 1rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', cursor: 'pointer' }}>
                    [ Purge All Data ]
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setLogFilter('all')}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.5rem 1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    background: logFilter === 'all' ? 'white' : 'none',
                    color: logFilter === 'all' ? 'black' : 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    fontWeight: logFilter === 'all' ? 'bold' : 'normal'
                  }}
                >
                  All ({logs.length})
                </button>
                <button
                  onClick={() => setLogFilter('resolved')}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.5rem 1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    background: logFilter === 'resolved' ? '#00ff00' : 'none',
                    color: logFilter === 'resolved' ? 'black' : '#00ff00',
                    border: '1px solid #00ff00',
                    cursor: 'pointer',
                    fontWeight: logFilter === 'resolved' ? 'bold' : 'normal'
                  }}
                >
                  Good ({logs.filter(l => l.resolutionStatus === 'resolved').length})
                </button>
                <button
                  onClick={() => setLogFilter('unresolved')}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.5rem 1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    background: logFilter === 'unresolved' ? '#ff4444' : 'none',
                    color: logFilter === 'unresolved' ? 'black' : '#ff4444',
                    border: '1px solid #ff4444',
                    cursor: 'pointer',
                    fontWeight: logFilter === 'unresolved' ? 'bold' : 'normal'
                  }}
                >
                  Bad ({logs.filter(l => l.resolutionStatus === 'unresolved').length})
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ marginTop: '1rem' }}>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'black',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ borderLeft: '2px solid rgba(255,255,255,0.2)', paddingLeft: '1rem', flex: 1, overflowY: 'auto' }}>
              {getFilteredLogs().length === 0 ? (
                <div style={{ padding: '3rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontFamily: "'Courier New', monospace", letterSpacing: '0.1em' }}>_ No data recorded</div>
              ) : (
                getFilteredLogs().slice().reverse().map((log) => (
                  <div key={log.id} style={{ marginBottom: '1.5rem' }}>
                    <div
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.7)', transition: 'color 0.2s' }}
                    >
                      {/* Status Indicator */}
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: log.resolutionStatus === 'resolved' ? '#00ff00' : log.resolutionStatus === 'unresolved' ? '#ff4444' : 'rgba(255,255,255,0.3)',
                        color: log.resolutionStatus === 'resolved' || log.resolutionStatus === 'unresolved' ? 'black' : 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '2px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {log.resolutionStatus === 'resolved' ? '✓' : log.resolutionStatus === 'unresolved' ? '✗' : '○'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem' }}>{formatDate(log.startTime)}</span>
                      <span style={{ height: '1px', flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' }}></span>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{log.messages.length} MSGS</span>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)' }}>{formatDuration(log.duration || 0)}</span>
                      <span style={{ fontSize: '0.75rem' }}>{selectedLog?.id === log.id ? '[-]' : '[+]'}</span>
                    </div>

                    {selectedLog?.id === log.id && (
                      <div style={{ marginTop: '1rem', marginLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {log.messages.map((msg, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '0.25rem', letterSpacing: '0.1em' }}>{msg.role}</span>
                            <div style={{ maxWidth: '80%', padding: '0.75rem', border: msg.role === 'user' ? '1px solid white' : '1px solid rgba(255,255,255,0.3)', backgroundColor: msg.role === 'user' ? 'white' : 'black', color: msg.role === 'user' ? 'black' : 'white' }}>
                              <p style={{ fontFamily: "'Courier New', monospace", fontSize: '0.875rem', margin: 0 }}>{msg.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2rem', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1rem', margin: 0 }}>System Configuration</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>

              {/* Motion Detection Panel */}
              <div style={{ gridColumn: '1 / -1', border: '1px solid white', padding: '2rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.75rem', left: '1rem', backgroundColor: 'black', padding: '0 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>Motion Detection</div>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                  {/* Controls */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>Sensitivity Threshold</label>
                        <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 'bold' }}>{sensitivity}%</span>
                      </div>

                      {/* Custom Range Slider */}
                      <div style={{ position: 'relative', height: '2rem', display: 'flex', alignItems: 'center' }}>
                        <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', backgroundColor: 'rgba(255,255,255,0.2)' }}></div>
                        <div style={{ position: 'absolute', left: 0, width: `${sensitivity}%`, height: '2px', backgroundColor: 'white' }}></div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sensitivity}
                          onChange={(e) => setSensitivity(Number(e.target.value))}
                          style={{
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer',
                            position: 'absolute',
                            zIndex: 10
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          left: `${sensitivity}%`,
                          width: '1rem',
                          height: '1rem',
                          backgroundColor: 'black',
                          border: '2px solid white',
                          transform: 'translateX(-50%)',
                          pointerEvents: 'none'
                        }}></div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                        <span>Low Sensitivity</span>
                        <span>High Sensitivity</span>
                      </div>
                    </div>

                    {/* Active Zone Controls */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>
                          Active Camera Zone
                        </div>
                        <button
                          type="button"
                          onClick={() => setCameraZone({ x: 25, y: 20, w: 50, h: 60 })}
                          style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'rgba(255,255,255,0.6)',
                            background: 'none',
                            border: '1px solid rgba(255,255,255,0.25)',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                          }}
                        >
                          Reset
                        </button>
                      </div>

                      <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                            <span>Left</span>
                            <span>{Math.round(cameraZone.x)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={cameraZone.x}
                            onChange={(e) => updateZone({ x: Number(e.target.value) })}
                            style={{ width: '100%', height: '1rem', backgroundColor: 'rgba(255,255,255,0.08)', appearance: 'none', cursor: 'pointer' }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                            <span>Top</span>
                            <span>{Math.round(cameraZone.y)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={cameraZone.y}
                            onChange={(e) => updateZone({ y: Number(e.target.value) })}
                            style={{ width: '100%', height: '1rem', backgroundColor: 'rgba(255,255,255,0.08)', appearance: 'none', cursor: 'pointer' }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                            <span>Width</span>
                            <span>{Math.round(cameraZone.w)}%</span>
                          </div>
                          <input
                            type="range"
                            min={5}
                            max={100}
                            value={cameraZone.w}
                            onChange={(e) => updateZone({ w: Number(e.target.value) })}
                            style={{ width: '100%', height: '1rem', backgroundColor: 'rgba(255,255,255,0.08)', appearance: 'none', cursor: 'pointer' }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                            <span>Height</span>
                            <span>{Math.round(cameraZone.h)}%</span>
                          </div>
                          <input
                            type="range"
                            min={5}
                            max={100}
                            value={cameraZone.h}
                            onChange={(e) => updateZone({ h: Number(e.target.value) })}
                            style={{ width: '100%', height: '1rem', backgroundColor: 'rgba(255,255,255,0.08)', appearance: 'none', cursor: 'pointer' }}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                        The conversation will auto-start only when motion is detected inside this zone.
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                      Adjust the threshold to filter out background noise. Higher values require more movement to trigger the system.
                    </div>
                  </div>

                  {/* Feed */}
                  <div style={{ width: '16rem' }}>
                    <div style={{
                      width: '100%',
                      aspectRatio: '4/3',
                      backgroundColor: 'black',
                      border: '1px solid rgba(255,255,255,0.3)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div
                        ref={feedRef}
                        onPointerMove={onZonePointerMove}
                        onPointerUp={onZonePointerUp}
                        onPointerCancel={onZonePointerUp}
                        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
                      >
                        <PresenceDetector
                          onPresence={() => { }}
                          isActive={false}
                          sensitivity={sensitivity}
                          debug={true}
                          region={cameraZone}
                        />

                        {/* Interactive ROI (drag + resize) */}
                        <div
                          onPointerDown={(e) => onZonePointerDown(e, 'move')}
                          style={{
                            position: 'absolute',
                            left: `${cameraZone.x}%`,
                            top: `${cameraZone.y}%`,
                            width: `${cameraZone.w}%`,
                            height: `${cameraZone.h}%`,
                            border: '2px solid rgba(255,255,255,0.85)',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            cursor: 'move',
                            zIndex: 20,
                            touchAction: 'none',
                          }}
                        >
                          {/* Handles */}
                          {([
                            { h: 'nw', left: '-6px', top: '-6px', cursor: 'nwse-resize' },
                            { h: 'ne', right: '-6px', top: '-6px', cursor: 'nesw-resize' },
                            { h: 'sw', left: '-6px', bottom: '-6px', cursor: 'nesw-resize' },
                            { h: 'se', right: '-6px', bottom: '-6px', cursor: 'nwse-resize' },
                          ] as const).map((p) => (
                            <div
                              key={p.h}
                              onPointerDown={(e) => onZonePointerDown(e, 'resize', p.h)}
                              style={{
                                position: 'absolute',
                                width: '12px',
                                height: '12px',
                                backgroundColor: 'black',
                                border: '2px solid white',
                                ...('left' in p ? { left: p.left } : {}),
                                ...('right' in p ? { right: p.right } : {}),
                                ...('top' in p ? { top: p.top } : {}),
                                ...('bottom' in p ? { bottom: p.bottom } : {}),
                                cursor: p.cursor,
                                touchAction: 'none',
                              }}
                            />
                          ))}
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              right: 0,
                              bottom: '-1.1rem',
                              textAlign: 'center',
                              fontSize: '8px',
                              color: 'rgba(255,255,255,0.55)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              pointerEvents: 'none',
                            }}
                          >
                            drag box / drag corners
                          </div>
                        </div>
                      </div>

                      {/* Crosshairs */}
                      <div style={{ position: 'absolute', top: '50%', left: '20%', right: '20%', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }}></div>
                      <div style={{ position: 'absolute', left: '50%', top: '20%', bottom: '20%', width: '1px', backgroundColor: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }}></div>

                      {/* Corner Markers */}
                      <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', width: '0.5rem', height: '0.5rem', borderTop: '1px solid white', borderLeft: '1px solid white' }}></div>
                      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '0.5rem', height: '0.5rem', borderTop: '1px solid white', borderRight: '1px solid white' }}></div>
                      <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', width: '0.5rem', height: '0.5rem', borderBottom: '1px solid white', borderLeft: '1px solid white' }}></div>
                      <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', width: '0.5rem', height: '0.5rem', borderBottom: '1px solid white', borderRight: '1px solid white' }}></div>

                      <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', fontSize: '8px', color: 'white', backgroundColor: 'red', padding: '0 0.25rem', fontWeight: 'bold' }}>LIVE</div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Sensor Feed Input
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.75rem', left: '1rem', backgroundColor: 'black', padding: '0 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>Subtitles</div>
                <div style={{ flex: 1, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  Display real-time text transcription of the conversation on the main display.
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: showSubtitles ? 'white' : 'rgba(255,255,255,0.3)' }}>
                    Status: {showSubtitles ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <button
                    onClick={() => setShowSubtitles(!showSubtitles)}
                    style={{
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      background: showSubtitles ? 'white' : 'transparent',
                      border: '1px solid white',
                      color: showSubtitles ? 'black' : 'white',
                      cursor: 'pointer',
                      padding: '0.5rem 1rem',
                      minWidth: '8rem'
                    }}
                  >
                    {showSubtitles ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Voice + Language + Model */}
              <div style={{ gridColumn: '1 / -1', border: '1px solid rgba(255,255,255,0.3)', padding: '1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.75rem', left: '1rem', backgroundColor: 'black', padding: '0 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>
                  Voice & Language
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Language</label>
                    <select
                      value={assistantLanguage}
                      onChange={(e) => setAssistantLanguage(e.target.value as any)}
                      style={{ backgroundColor: 'black', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0.65rem', fontFamily: "'Courier New', monospace" }}
                    >
                      <option value="ru">Russian (RU)</option>
                      <option value="en">English (EN)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Voice</label>
                    <select
                      value={assistantVoiceGender}
                      onChange={(e) => setAssistantVoiceGender(e.target.value as any)}
                      style={{ backgroundColor: 'black', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0.65rem', fontFamily: "'Courier New', monospace" }}
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                      Applies on next call start.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Model</label>
                    <select
                      value={assistantModel}
                      onChange={(e) => setAssistantModel(e.target.value)}
                      style={{ backgroundColor: 'black', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0.65rem', fontFamily: "'Courier New', monospace" }}
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                      <option value="gpt-4o">gpt-4o</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  Language affects speech, transcription, subtitles, and the navigation card parsing.
                </div>
              </div>

              <div style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-0.75rem', left: '1rem', backgroundColor: 'black', padding: '0 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>Auto-Start</div>
                <div style={{ flex: 1, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  Automatically initiate conversation when a person is detected in the camera frame.
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: autoStart ? 'white' : 'rgba(255,255,255,0.3)' }}>
                    Status: {autoStart ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <button
                    onClick={() => setAutoStart(!autoStart)}
                    style={{
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      background: autoStart ? 'white' : 'transparent',
                      border: '1px solid white',
                      color: autoStart ? 'black' : 'white',
                      cursor: 'pointer',
                      padding: '0.5rem 1rem',
                      minWidth: '8rem'
                    }}
                  >
                    {autoStart ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              <button
                onClick={saveSettings}
                style={{
                  gridColumn: '1 / -1',
                  backgroundColor: 'white',
                  color: 'black',
                  padding: '1.5rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  fontSize: '1.125rem',
                  marginTop: '1rem',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'transform 0.1s'
                }}
              >
                {settingsSaved ? '[ Configuration Saved ]' : '[ Save System State ]'}
              </button>
            </div>
          </div>
        )}

        {/* PROMPT */}
        {activeTab === 'prompt' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: '56rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1rem', margin: 0 }}>AI Protocol (System Prompt)</h2>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Load prompt file (.txt / .csv / .json)
                </div>
                {promptFileName ? (
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Loaded: {promptFileName}
                  </div>
                ) : (
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    No file loaded
                  </div>
                )}
              </div>

              <label
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  backgroundColor: 'black',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.4)',
                  padding: '0.75rem 1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                [ Choose File ]
                <input
                  type="file"
                  accept=".txt,.csv,.json,text/plain,application/json,text/csv"
                  onChange={onPromptFileSelected}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {promptFileError && (
              <div
                style={{
                  marginTop: '0.75rem',
                  backgroundColor: 'rgba(127,29,29,0.2)',
                  border: '1px solid rgb(239,68,68)',
                  color: 'rgb(239,68,68)',
                  padding: '0.5rem',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {promptFileError}
              </div>
            )}

            <div style={{ flex: 1, position: 'relative', border: '1px solid rgba(255,255,255,0.3)', padding: '0.25rem', marginTop: '2rem' }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{ width: '100%', height: '100%', backgroundColor: 'black', padding: '1.5rem', color: 'white', fontFamily: "'Courier New', monospace", fontSize: '0.875rem', lineHeight: 1.6, outline: 'none', resize: 'none', border: 'none' }}
                placeholder="Initialize system prompt..."
                spellCheck={false}
              />
              <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                {prompt.length} chars
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={saveSettings}
                style={{ backgroundColor: 'white', color: 'black', padding: '1rem 3rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none' }}
              >
                {settingsSaved ? '[ Saved ]' : '[ Update Protocol ]'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'black', border: '2px solid white', padding: '2rem', maxWidth: '500px', width: '90%', fontFamily: "'Courier New', monospace" }}>
            <h3 style={{ fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '0.5rem' }}>Export Conversations</h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.5rem' }}>Period:</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setExportPeriod('full')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: exportPeriod === 'full' ? 'white' : 'transparent',
                    color: exportPeriod === 'full' ? 'black' : 'white',
                    border: '1px solid white',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                    fontWeight: exportPeriod === 'full' ? 'bold' : 'normal'
                  }}
                >
                  Full Period
                </button>
                <button
                  onClick={() => setExportPeriod('timeline')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: exportPeriod === 'timeline' ? 'white' : 'transparent',
                    color: exportPeriod === 'timeline' ? 'black' : 'white',
                    border: '1px solid white',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                    fontWeight: exportPeriod === 'timeline' ? 'bold' : 'normal'
                  }}
                >
                  Timeline
                </button>
              </div>
            </div>

            {exportPeriod === 'timeline' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.5rem' }}>Start Date:</label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', backgroundColor: 'black', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontFamily: "'Courier New', monospace" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.5rem' }}>End Date:</label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', backgroundColor: 'black', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontFamily: "'Courier New', monospace" }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>Preview:</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{getExportPreviewCount()} Conversations</div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={exportToCSV}
                disabled={exportPeriod === 'timeline' && (!exportStartDate || !exportEndDate)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'white',
                  color: 'black',
                  border: 'none',
                  cursor: exportPeriod === 'timeline' && (!exportStartDate || !exportEndDate) ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  fontWeight: 'bold',
                  opacity: exportPeriod === 'timeline' && (!exportStartDate || !exportEndDate) ? 0.5 : 1
                }}
              >
                [ Export ]
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'transparent',
                  color: 'white',
                  border: '1px solid white',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em'
                }}
              >
                [ Cancel ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'black', border: '2px solid rgb(239,68,68)', padding: '2rem', maxWidth: '400px', width: '90%', fontFamily: "'Courier New', monospace" }}>
            <h3 style={{ fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', color: 'rgb(239,68,68)' }}>⚠ Confirm Deletion</h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem', color: 'rgba(255,255,255,0.7)' }}>
              This will permanently delete ALL conversation logs. Enter admin password to confirm.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.5rem' }}>Password:</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && confirmDelete()}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: 'black', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontFamily: "'Courier New', monospace", fontSize: '1rem' }}
                autoFocus
              />
            </div>

            {deleteError && (
              <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(239,68,68,0.2)', border: '1px solid rgb(239,68,68)', color: 'rgb(239,68,68)', fontSize: '0.75rem', textAlign: 'center' }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'rgb(239,68,68)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  fontWeight: 'bold'
                }}
              >
                [ Delete All ]
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'transparent',
                  color: 'white',
                  border: '1px solid white',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em'
                }}
              >
                [ Cancel ]
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
