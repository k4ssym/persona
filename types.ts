
export enum AppState {
  IDLE = 'IDLE',           // Sleep mode
  READY = 'READY',         // Dashboard mode (Mic Off, waiting for avatar click)
  LISTENING = 'LISTENING', // Conversation Mode: Mic Active
  PROCESSING = 'PROCESSING', // Conversation Mode: Thinking
  SPEAKING = 'SPEAKING',   // Conversation Mode: Replying
  ERROR = 'ERROR',
  CONNECTING = 'CONNECTING'
}

export type ActiveView = 'home' | 'analytics' | 'logs' | 'settings';

export interface AppSettings {
  systemPrompt: string;
  sensitivity: number; // 0.0 to 1.0
  presenceTimeout: number; // seconds
  subtitlesEnabled: boolean;
  language: 'en' | 'es' | 'fr' | 'de' | 'ru';
  voiceId: string;
  speechSpeed: number; // 0.5 to 2.0
  detectionZone: { x: number; y: number; w: number; h: number }; // percentages
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  userQuery: string; // Summary/Title
  department: string; // e.g., Sales, HR, IT
  status: 'resolved' | 'unresolved' | 'escalated';
  duration: string;
  messages: ChatMessage[];
  metadata: {
    latency: number; // ms
    confidence: number; // 0.0 - 1.0
    model: string;
    tokensUsed: number;
  };
  isFlagged: boolean;
}

export interface InteractionState {
  appState: AppState;
  motionDetected: boolean;
  transcript: string;
  error?: string;
  isMicOn: boolean;
  // New derived states for UI flow
  isIdle: boolean;
  inConversation: boolean;
  showDashboard: boolean; // Controls widget visibility
  lastAction: string | null; // AI Action Trigger (e.g., 'SHOW_MAP')

  // New Admin/View States
  activeView: ActiveView;
  logs: LogEntry[];
  settings: AppSettings;
}

import { TranslationKeys } from './lib/translations';

export interface KioskContextType extends InteractionState {
  wakeSystem: () => void;
  enterConversation: () => void;
  exitConversation: () => void;
  toggleMute: () => void;
  resetKiosk: () => void;
  startSession: () => void;
  stopSession: () => void;
  toggleDashboard: () => void;
  toggleMotion: () => void;
  clearAction: () => void;
  triggerAction: (action: string) => void;
  setActiveView: (view: ActiveView) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  toggleLogFlag: (id: string) => void;
  t: (key: TranslationKeys) => string;
}