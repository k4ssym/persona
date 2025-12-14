import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Clock, Activity, MoreHorizontal, TrendingUp } from 'lucide-react';

export default function AdminDashboardWidgets() {
  const [totalCount, setTotalCount] = useState<number | null>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStats = async () => {
      // Get exact count of logs
      const { count, error } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        setTotalCount(count);
      }
    };

    fetchStats();

    // Subscribe to changes to update count in real-time
    const channel = supabase
      .channel('stats_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, () => {
         setTotalCount(prev => (prev || 0) + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      {/* Widget 1: Total Volume */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex-1 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
         
         <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
               <Clock size={18} />
            </div>
            <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full text-[10px] font-bold">
               <TrendingUp size={12} />
               <span>Live</span>
            </div>
         </div>
         
         <div className="relative z-10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Interaction Volume</p>
            <h3 className="text-4xl font-bold text-slate-900 mt-2 tracking-tight">
              {totalCount !== null ? totalCount.toLocaleString() : '-'}
            </h3>
         </div>
      </div>

      {/* Widget 2: Avg Response (Mocked for now as latency isn't in simple schema yet) */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex-1">
         <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
               <Activity size={18} />
            </div>
            <MoreHorizontal size={20} className="text-slate-300" />
         </div>
         <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Avg Response Time</p>
         <h3 className="text-4xl font-bold text-slate-900 mt-2 tracking-tight">1.2s</h3>
      </div>
    </>
  );
}