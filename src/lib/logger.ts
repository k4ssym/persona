// Логирование разговоров

export interface ConversationLog {
  id: string;
  startTime: Date;
  endTime?: Date;
  messages: MessageLog[];
  duration?: number; // seconds
}

export interface MessageLog {
  timestamp: Date;
  role: 'user' | 'assistant';
  text: string;
}

class ConversationLogger {
  private currentConversation: ConversationLog | null = null;
  private logs: ConversationLog[] = [];

  private readonly STORAGE_KEY = 'reception_conversation_logs';
  private readonly LEGACY_STORAGE_KEYS = ['reception_logs'];

  startConversation(): string {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentConversation = {
      id,
      startTime: new Date(),
      messages: []
    };
    console.log(`[Logger] Started conversation: ${id}`);
    return id;
  }

  addMessage(role: 'user' | 'assistant', text: string) {
    if (!this.currentConversation) {
      this.startConversation();
    }
    
    this.currentConversation!.messages.push({
      timestamp: new Date(),
      role,
      text
    });
    console.log(`[Logger] ${role}: ${text}`);
  }

  endConversation() {
    if (!this.currentConversation) return;

    this.currentConversation.endTime = new Date();
    this.currentConversation.duration = Math.round(
      (this.currentConversation.endTime.getTime() - this.currentConversation.startTime.getTime()) / 1000
    );

    this.logs.push(this.currentConversation);
    this.saveToStorage();
    
    console.log(`[Logger] Ended conversation: ${this.currentConversation.id}, duration: ${this.currentConversation.duration}s`);
    this.currentConversation = null;
  }

  getLogs(): ConversationLog[] {
    this.loadFromStorage();
    return this.logs;
  }

  getStats() {
    const logs = this.getLogs();
    return {
      totalConversations: logs.length,
      totalMessages: logs.reduce((sum, log) => sum + log.messages.length, 0),
      averageDuration: logs.length > 0 
        ? Math.round(logs.reduce((sum, log) => sum + (log.duration || 0), 0) / logs.length)
        : 0,
      today: logs.filter(log => {
        const today = new Date();
        const logDate = new Date(log.startTime);
        return logDate.toDateString() === today.toDateString();
      }).length
    };
  }

  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
      for (const key of this.LEGACY_STORAGE_KEYS) localStorage.removeItem(key);
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
      } catch (e) {
        console.error('Failed to save logs:', e);
      }
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.logs = JSON.parse(stored);
          return;
        }

        // Backward compatibility
        for (const key of this.LEGACY_STORAGE_KEYS) {
          const legacy = localStorage.getItem(key);
          if (legacy) {
            this.logs = JSON.parse(legacy);
            // Migrate forward
            try {
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
              localStorage.removeItem(key);
            } catch {
              // ignore
            }
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load logs:', e);
      }
    }
  }
}

export const logger = new ConversationLogger();

