import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { MessageSquare, Bot, Loader2, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface LogItem {
  id: number;
  created_at: string;
  user_text: string;
  ai_text: string;
  action_taken: string;
}

export default function ConversationLogs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize browser client for client-side auth context
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchLogs();
    
    // Realtime subscription for new logs
    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs' },
        (payload) => {
          setLogs((currentLogs) => [payload.new as LogItem, ...currentLogs]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) setLogs(data);
    } catch (err) {
      console.error("Error loading logs:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
        <Loader2 size={24} className="animate-spin" />
        <span className="text-xs font-medium">Syncing database...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
        <MessageSquare size={32} className="mb-2 opacity-50" />
        <p className="text-sm">No interactions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {logs.map((log) => (
        <div key={log.id} className="group flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-100 hover:shadow-md transition-all duration-300">
           
           {/* Icon Status */}
           <div className={`w-10 h-10 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
             log.action_taken === 'CALL_HUMAN' 
               ? 'bg-red-50 border-red-100 text-red-500' 
               : 'bg-white border-slate-200 text-slate-400 group-hover:text-blue-500 group-hover:border-blue-200'
           }`}>
              {log.action_taken === 'CALL_HUMAN' ? <AlertTriangle size={18} /> : <MessageSquare size={18} />}
           </div>
           
           <div className="flex-1 min-w-0 space-y-1">
              {/* Header: Query + Time */}
              <div className="flex justify-between items-start">
                 <h4 className="font-bold text-slate-900 truncate pr-4 text-sm">
                   "{log.user_text || '...'}"
                 </h4>
                 <div className="flex items-center gap-1.5 shrink-0 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                   <Clock size={10} className="text-slate-400" />
                   <span className="text-[10px] font-bold text-slate-500">
                     {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                 </div>
              </div>

              {/* Body: Response */}
              <p className="text-xs text-slate-500 flex items-start gap-1.5 leading-relaxed">
                <Bot size={12} className="shrink-0 mt-0.5 text-blue-400" /> 
                <span className="line-clamp-2">{log.ai_text}</span>
              </p>

              {/* Action Badge */}
              {log.action_taken && log.action_taken !== 'IDLE' && (
                <div className="pt-2">
                   <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                     log.action_taken === 'SHOW_MAP' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                     log.action_taken === 'CALL_HUMAN' ? 'bg-red-50 text-red-600 border-red-100' : 
                     'bg-slate-100 text-slate-600 border-slate-200'
                   }`}>
                     {log.action_taken === 'SHOW_MAP' && <CheckCircle2 size={10} />}
                     {log.action_taken}
                   </span>
                </div>
              )}
           </div>
        </div>
      ))}
    </div>
  );
}