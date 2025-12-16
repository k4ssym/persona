import { supabase } from './supabase';

export interface Message {
    role: 'user' | 'assistant';
    text: string;
    timestamp: number;
}

export interface ConversationLog {
    id: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    messages: Message[];
    tokensUsed?: number;
    latency?: number;
    resolutionStatus?: 'resolved' | 'unresolved' | 'neutral';
    cost?: number;
}

class Logger {
    private currentLogId: string | null = null;

    // --- Supabase / Async Methods ---

    async startConversation(): Promise<string> {
        const id = crypto.randomUUID(); // Use UUID for reliable ID
        this.currentLogId = id;
        const startTime = new Date().toISOString();

        const { error } = await supabase
            .from('conversations')
            .insert({
                id,
                start_time: startTime
            });

        if (error) console.error('Supabase start error:', error);

        return id;
    }

    async addMessage(role: 'user' | 'assistant', text: string) {
        if (!this.currentLogId) await this.startConversation();
        if (!this.currentLogId) return; // Should allow startConversation to finish

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: this.currentLogId,
                role,
                text,
                timestamp: Date.now()
            });

        if (error) console.error('Supabase message error:', error);
    }

    async endConversation(metadata?: { tokens?: number, latency?: number, status?: 'resolved' | 'unresolved' | 'neutral', cost?: number }) {
        if (!this.currentLogId) return;

        const endTime = new Date().toISOString();

        // We can fetch start_time to calculate duration, or just trust the DB/client time
        // For simplicity, we update with what we have.
        // Duration we can calculate if we knew start time. 
        // Let's fetch the conversation first to correct duration? 
        // Or just store end_time and let UI calculate duration.
        // But the table has 'duration' column.

        // Let's just update end_time and metadata. calculate duration in SQL or client?
        // User asked to "save... important things".

        const updatePayload: any = {
            end_time: endTime
        };

        if (metadata) {
            if (metadata.tokens !== undefined) updatePayload.tokens_used = metadata.tokens;
            if (metadata.latency !== undefined) updatePayload.latency = metadata.latency;
            if (metadata.status !== undefined) updatePayload.resolution_status = metadata.status;
            if (metadata.cost !== undefined) updatePayload.cost = metadata.cost;
        }

        // Calculate duration: (End - Start).
        // querying start time:
        const { data } = await supabase.from('conversations').select('start_time').eq('id', this.currentLogId).single();
        if (data?.start_time) {
            const start = new Date(data.start_time).getTime();
            const end = new Date(endTime).getTime();
            updatePayload.duration = (end - start) / 1000;
        }

        const { error } = await supabase
            .from('conversations')
            .update(updatePayload)
            .eq('id', this.currentLogId);

        if (error) console.error('Supabase end error:', error);
        this.currentLogId = null;
    }

    async getLogs(): Promise<ConversationLog[]> {
        const { data: convs, error } = await supabase
            .from('conversations')
            .select(`
        *,
        messages (*)
      `)
            .order('start_time', { ascending: false });

        if (error) {
            console.error('Supabase getLogs error:', error);
            return [];
        }

        return convs.map((c: any) => ({
            id: c.id,
            startTime: c.start_time,
            endTime: c.end_time,
            duration: c.duration,
            tokensUsed: c.tokens_used,
            latency: c.latency,
            resolutionStatus: c.resolution_status,
            cost: c.cost,
            messages: (c.messages || []).map((m: any) => ({
                role: m.role,
                text: m.text,
                timestamp: m.timestamp
            })).sort((a: any, b: any) => a.timestamp - b.timestamp)
        }));
    }

    async clearLogs() {
        // Delete all conversations (cascade will delete messages automatically)
        const { error } = await supabase
            .from('conversations')
            .delete()
            .neq('id', ''); // This effectively deletes all rows (id is never empty string)

        if (error) {
            console.error('Supabase clearLogs error:', error);
        } else {
            console.log('All logs cleared successfully');
        }
    }

    async getStats() {
        // We can run separate queries or aggregate in one.
        // For simplicity, fetch all logs (cached by getLogs if called) or just count queries.
        // To minimize data transfer, count queries are better.

        const { count: totalConversations } = await supabase.from('conversations').select('*', { count: 'exact', head: true });

        const { count: totalMessages } = await supabase.from('messages').select('*', { count: 'exact', head: true });

        // For averages, we need data.
        // Let's use getLogs() output if acceptable, or write a summary query.
        // Since the original was sync and the dashboard loads everything, let's reuse getLogs which fetches everything.
        // Optimization: The dashboard logic calls getLogs AND getStats. 
        // If getStats re-fetches everything, it's wasteful.
        // But getLogs is "download all".

        // Let's implement getStats using getLogs logic inside the component 
        // OR return default stats here and let component compute from logs.
        // The previous implementation computed stats *from logs* in 'loadData'.
        // `logger.getStats()` computes from localStorage.

        // I will return a basic promise that resolves to empty stats,
        // and rely on the UI to compute stats from the full log list it fetches anyway.
        // Because calculating "today's count" etc is easier in JS if we already have the array.

        return {
            totalConversations: totalConversations || 0,
            totalMessages: totalMessages || 0,
            averageDuration: 0, // Computed in UI
            today: 0 // Computed in UI
        };
    }
}

export const logger = new Logger();
