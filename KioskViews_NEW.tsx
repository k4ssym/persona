import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKiosk } from '../context/KioskContext';
import { LogEntry } from '../types';
import {
   BarChart3, TrendingUp, Clock, Search, Save, Globe, Eye, MessageSquare,
   Mic, Activity, FileText, Settings, ArrowRight, Share2, HelpCircle, CheckCircle2,
   XCircle, Filter, Star, ChevronRight, User, Bot, AlertTriangle, Cpu, Zap, ScanFace,
   Volume2, Camera, Calendar, Hash, Tag, MoreHorizontal, LayoutGrid, List, ArrowUpRight,
   PieChart, ScrollText, Gauge, Sliders, Layers, MousePointer2, Move, Maximize, Download
} from 'lucide-react';
import { exportLogsToCSV, calculateAnalytics } from '../lib/analyticsUtils';

// Fix: Cast motion to any to prevent TypeScript errors
const Motion = motion as any;

export default function KioskViews() {
   const { activeView } = useKiosk();

   // If home, this component shouldn't render, but safety check:
   if (activeView === 'home') return null;

   return (
      <Motion.div
         initial={{ opacity: 0, x: 20 }}
         animate={{ opacity: 1, x: 0 }}
         exit={{ opacity: 0, x: -20 }}
         transition={{ duration: 0.3 }}
         className="w-full h-full flex flex-col pt-16"
      >
         {/* New Professional Header */}
         <div className="mb-10 flex flex-col gap-2 border-b border-white/5 pb-8">
            <div className="flex items-center gap-2">
               <div className={`w-1.5 h-4 rounded-full ${activeView === 'analytics' ? 'bg-blue-500' :
                  activeView === 'logs' ? 'bg-purple-500' : 'bg-emerald-500'
                  }`} />
               <span className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">
                  {activeView === 'analytics' ? 'Intelligence Module' :
                     activeView === 'logs' ? 'System Database' : 'Configuration'}
               </span>
            </div>

            <div className="flex justify-between items-end">
               <div>
                  <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
                     {activeView === 'analytics' && "System Analytics"}
                     {activeView === 'logs' && "Interaction Logs"}
                     {activeView === 'settings' && "System Settings"}
                  </h1>
                  <p className="text-white/40 text-sm mt-2 font-light max-w-2xl leading-relaxed">
                     {activeView === 'analytics' && "Real-time performance metrics, user engagement statistics, and operational insights."}
                     {activeView === 'logs' && "Comprehensive audit trail of all kiosk interactions, conversation transcripts, and debug data."}
                     {activeView === 'settings' && "Manage hardware sensors, neural core parameters, and visual perception zones."}
                  </p>
               </div>

               {/* Contextual Actions (Export removed) */}
               <div className="hidden md:flex items-center gap-3">
                  {activeView === 'logs' && (
                     <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                        <button className="p-2 rounded bg-white/10 text-white"><List size={16} /></button>
                        <button className="p-2 rounded hover:bg-white/5 text-white/40"><LayoutGrid size={16} /></button>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Content Container */}
         <div className="flex-1 overflow-hidden">
            {activeView === 'analytics' && <div className="h-full overflow-y-auto custom-scrollbar pr-2 pb-10"><AnalyticsView /></div>}
            {activeView === 'logs' && <LogsView />}
            {activeView === 'settings' && <div className="h-full overflow-y-auto custom-scrollbar pr-2 pb-10"><SettingsView /></div>}
         </div>
      </Motion.div>
   );
}

// --- HELPER COMPONENT ---
const GlassCard = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
   <div className={`bg-[#0c0c0e] border border-white/10 rounded-[24px] shadow-xl ${className}`}>
      {children}
   </div>
);

const StatusRow = ({ label, active }: { label: string, active: boolean }) => (
   <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
      <span className="text-sm font-medium text-white/80">{label}</span>
      <div className="flex items-center gap-2">
         <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-emerald-400' : 'text-red-400'}`}>
            {active ? 'Operational' : 'Offline'}
         </span>
         <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      </div>
   </div>
);

// --- ANALYTICS VIEW ---
function AnalyticsView() {
   const { logs } = useKiosk();
   const [chartPeriod, setChartPeriod] = useState<'Week' | 'Month'>('Week');

   const totalInteractions = logs.length;
   const resolvedCount = logs.filter(l => l.status === 'resolved').length;
   const successRate = totalInteractions > 0
      ? Math.round((resolvedCount / totalInteractions) * 100)
      : 100;

   const recentLogs = useMemo(() => logs.slice(0, 4), [logs]);

   // --- REAL METRICS CALCULATION ---
   const { avgLatency, totalTokens, chartValues } = useMemo(() => {
      if (logs.length === 0) return { avgLatency: 0, totalTokens: 0, chartValues: Array(chartPeriod === 'Week' ? 7 : 6).fill(0) };

      // 1. Averages & Totals
      const totalLat = logs.reduce((acc, log) => acc + (log.metadata?.latency || 0), 0);
      const totTokens = logs.reduce((acc, log) => acc + (log.metadata?.tokensUsed || 0), 0);

      let values: number[] = [];

      if (chartPeriod === 'Week') {
         // 2. Chart Data (Last 7 days for 'Week')
         const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toLocaleDateString();
         });

         const dayCounts: Record<string, number> = {};
         logs.forEach(log => {
            const d = new Date(log.startTime).toLocaleDateString();
            dayCounts[d] = (dayCounts[d] || 0) + 1;
         });

         values = last7Days.map(date => dayCounts[date] || 0);

      } else {
         // Monthly View (Last 6 Months)
         const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return `${d.getFullYear()}-${d.getMonth()}`;
         });

         const monthCounts: Record<string, number> = {};
         logs.forEach(log => {
            const d = new Date(log.startTime);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            monthCounts[key] = (monthCounts[key] || 0) + 1;
         });

         values = last6Months.map(key => monthCounts[key] || 0);
      }

      return {
         avgLatency: Math.round(totalLat / logs.length),
         totalTokens: totTokens,
         chartValues: values
      };
   }, [logs, chartPeriod]);

   const chartData = useMemo(() => {
      if (chartValues.every(v => v === 0)) return Array(chartValues.length).fill(0);

      const max = Math.max(...chartValues);
      const scale = max > 0 ? 100 / max : 1;
      return chartValues.map(v => v * scale);
   }, [chartValues]);

   // Labels for the graph
   const chartLabels = useMemo(() => {
      if (chartPeriod === 'Week') {
         const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
         return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return days[d.getDay()];
         });
      } else {
         return Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return d.toLocaleString('default', { month: 'short' });
         });
      }
   }, [chartPeriod]);

   return (
      <div className="grid grid-cols-12 gap-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

         {/* 1. INTERACTION VOLUME */}
         <div className="col-span-12 lg:col-span-7 xl:col-span-8 bg-[#111111] rounded-[32px] p-8 border border-white/5 relative flex flex-col justify-between min-h-[360px] shadow-2xl overflow-hidden group">
            <div className="flex justify-between items-start z-10">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white">
                     <BarChart3 size={20} />
                  </div>
                  <div>
                     <h3 className="text-lg font-medium text-white">Interaction Volume</h3>
                     <p className="text-white/40 text-xs">Traffic Analysis</p>
                  </div>
               </div>
               <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                  <button
                     onClick={() => setChartPeriod('Week')}
                     className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${chartPeriod === 'Week' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                  >
                     Weekly
                  </button>
                  <button
                     onClick={() => setChartPeriod('Month')}
                     className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${chartPeriod === 'Month' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                  >
                     Monthly
                  </button>
               </div>
            </div>

            <div className="mt-8 mb-4 z-10">
               <div className="flex items-start gap-2">
                  <span className="text-6xl font-medium text-white tracking-tighter">{totalInteractions}</span>
                  <div className="w-8 h-8 rounded-full bg-[#bbf7d0] flex items-center justify-center -mt-2">
                     <ArrowUpRight size={18} className="text-black" />
                  </div>
               </div>
               <p className="text-white/30 text-sm mt-2 font-medium">Total visitors tracked</p>
            </div>

            <div className="flex items-end gap-3 h-32 w-full mt-auto z-10">
               {chartData.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end group/bar h-full gap-2 cursor-pointer">
                     <div className="w-full relative rounded-t-lg overflow-hidden bg-[#1f1f1f] group-hover/bar:bg-[#2a2a2a] transition-colors" style={{ height: '100%' }}>
                        <div className="absolute bottom-0 w-full bg-[#a78bfa]" style={{ height: `${h * 0.4}%` }} />
                        <Motion.div
                           initial={{ height: 0 }}
                           animate={{ height: `${h * 0.5}%` }}
                           transition={{ duration: 0.5, delay: i * 0.05 }}
                           className="absolute w-full bg-[#bbf7d0] transition-all duration-500 group-hover/bar:brightness-110"
                           style={{ bottom: `${h * 0.4}%`, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
                        />
                     </div>
                     <span className="text-center text-[10px] font-bold text-white/20 group-hover/bar:text-white/60 transition-colors">
                        {chartLabels[i]}
                     </span>
                  </div>
               ))}
            </div>
         </div>

         {/* 2. RECENT QUERIES */}
         <div className="col-span-12 lg:col-span-5 xl:col-span-4 bg-[#1c1c1e] rounded-[32px] p-8 border border-white/5 flex flex-col gap-6 shadow-xl">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white">
                     <ScrollText size={20} />
                  </div>
                  <div>
                     <h3 className="text-lg font-medium text-white">Live Stream</h3>
                     <p className="text-white/40 text-xs">Recent Activity</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar max-h-[250px] pr-2">
               {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
                     <div className="flex items-center gap-3 overflow-hidden">
                        <div className="relative shrink-0">
                           <div className={`w-10 h-10 rounded-full ${log.department === 'IT' ? 'bg-purple-500' : 'bg-blue-500'} flex items-center justify-center text-white/90`}>
                              {log.department === 'IT' ? <Cpu size={18} /> : <User size={18} />}
                           </div>
                           <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#1c1c1e] rounded-full flex items-center justify-center">
                              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${log.status === 'resolved' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
                           </div>
                        </div>
                        <div className="min-w-0">
                           <p className="text-sm font-medium text-white group-hover:text-white transition-colors truncate">{log.userQuery}</p>
                           <p className="text-xs text-white/30 truncate">{log.department || 'General'}</p>
                        </div>
                     </div>
                     <span className="text-xs font-bold text-white/20 whitespace-nowrap ml-2">
                        {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
               ))}
               {recentLogs.length === 0 && (
                  <div className="text-center py-8 text-white/20 text-sm">No recent queries</div>
               )}
            </div>
         </div>

         {/* 3. SUCCESS RATE */}
         <div className="col-span-12 lg:col-span-5 xl:col-span-4 bg-[#bbf7d0] rounded-[32px] p-8 text-black relative min-h-[300px] flex flex-col justify-between overflow-hidden shadow-2xl group transition-transform hover:scale-[1.01] duration-300">
            <div className="flex justify-between items-start z-10">
               <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <PieChart size={20} className="text-black" />
               </div>
               <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors">
                     <ArrowUpRight size={16} className="text-black/60" />
                  </button>
               </div>
            </div>

            <div className="flex items-end justify-between z-10">
               <div>
                  <div className="flex items-baseline gap-1">
                     <span className="text-6xl font-medium tracking-tighter">{successRate}%</span>
                  </div>
                  <p className="text-black/60 font-medium text-sm">Resolution Rate</p>
               </div>
            </div>

            {/* Decorative Gauge */}
            <div className="absolute bottom-0 right-0 w-48 h-48 translate-x-10 translate-y-10 opacity-40 pointer-events-none transition-transform group-hover:rotate-12 duration-700">
               <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="black" strokeWidth="12" strokeOpacity="0.1" />
                  <Motion.circle
                     initial={{ strokeDashoffset: 251 }}
                     animate={{ strokeDashoffset: 251 - (251 * (successRate / 100)) }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     cx="50" cy="50" r="40"
                     fill="none"
                     stroke="black"
                     strokeWidth="12"
                     strokeDasharray="251"
                     strokeLinecap="round"
                  />
               </svg>
            </div>
         </div>

         {/* 4. SYSTEM FORECAST */}
         <div className="col-span-12 lg:col-span-7 xl:col-span-8 bg-[#1c1c1e] rounded-[32px] p-8 min-h-[300px] flex flex-col md:flex-row gap-8 border border-white/5 shadow-xl">
            {/* Left: Timeline */}
            <div className="flex-1 flex flex-col justify-between">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#bbf7d0] flex items-center justify-center text-black">
                     <TrendingUp size={20} />
                  </div>
                  <div>
                     <h3 className="text-lg font-medium text-white">Predictive Load</h3>
                     <p className="text-white/40 text-xs">AI Forecasting</p>
                  </div>
               </div>

               <div className="relative pl-4 border-l border-white/10 space-y-8 py-2">
                  {[
                     { year: "Now", title: "Peak Load", desc: "High traffic expected" },
                     { year: "+1h", title: "Maintenance", desc: "Scheduled optimization" },
                     { year: "+4h", title: "Idle Mode", desc: "Power saving enabled" },
                  ].map((item, i) => (
                     <div key={i} className="relative group/timeline cursor-default">
                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-[#1c1c1e] transition-colors ${i === 0 ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/20 group-hover/timeline:bg-white/60'}`} />
                        <p className="text-xs font-bold text-white/30 mb-0.5">{item.year}</p>
                        <h4 className="text-sm font-medium text-white">{item.title}</h4>
                        <p className="text-xs text-white/50">{item.desc}</p>
                     </div>
                  ))}
               </div>
            </div>

            {/* Right: Metric Cards */}
            <div className="flex-1 flex flex-col gap-4 justify-center">
               {/* Green Card - Latency */}
               <div className="bg-[#bbf7d0] rounded-[24px] p-5 text-black relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-xs font-bold opacity-60 uppercase">Avg Latency</p>
                     <Gauge size={16} />
                  </div>
                  <h3 className="text-3xl font-medium tracking-tight">{avgLatency}ms</h3>
                  <div className="flex items-center gap-2 mt-2">
                     <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className="h-full bg-black w-[45%] rounded-full" />
                     </div>
                     <span className="text-xs font-bold">+12%</span>
                  </div>
               </div>

               {/* Purple Card - Token Usage */}
               <div className="bg-[#a78bfa] rounded-[24px] p-5 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-xs font-bold opacity-70 uppercase">Tokens</p>
                     <Layers size={16} />
                  </div>
                  <h3 className="text-3xl font-medium tracking-tight">{(totalTokens / 1000).toFixed(1)}k</h3>
                  <div className="absolute bottom-0 right-0 w-full h-12 flex items-end justify-end opacity-30">
                     <svg viewBox="0 0 100 40" className="w-full h-full fill-white/50">
                        <path d="M0,40 Q20,10 40,25 T100,0 V40 H0 Z" />
                     </svg>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

// --- LOGS VIEW (File Manager Style) ---
function LogsView() {
   const { logs, toggleLogFlag } = useKiosk();
   const [selectedLogId, setSelectedLogId] = useState<string | null>(logs[0]?.id || null);
   const [searchQuery, setSearchQuery] = useState('');

   const selectedLog = logs.find(l => l.id === selectedLogId);

   const filteredLogs = useMemo(() => {
      return logs.filter(log => {
         const matchesSearch = log.userQuery.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.department.toLowerCase().includes(searchQuery.toLowerCase());
         return matchesSearch;
      });
   }, [logs, searchQuery]);

   return (
      <div className="flex h-full gap-6 pb-6 animate-in fade-in zoom-in-95 duration-500">

         {/* MAIN LIST AREA */}
         <div className="flex-1 flex flex-col bg-[#0c0c0e] rounded-[24px] border border-white/10 overflow-hidden shadow-2xl">

            {/* Toolbar */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                     <Filter size={14} className="text-white/40" />
                     <span className="text-xs text-white/60 font-medium">Filter</span>
                  </div>
                  <div className="h-4 w-px bg-white/10" />
                  <span className="text-xs text-white/40">{filteredLogs.length} Records</span>
               </div>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                  <input
                     type="text"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search logs..."
                     className="bg-[#18181b] border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-blue-500 w-64 transition-all"
                  />
               </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 px-6 py-3 border-b border-white/5 text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/[0.01]">
               <div className="col-span-5 flex items-center gap-2">Interaction</div>
               <div className="col-span-3">Department</div>
               <div className="col-span-2">Duration</div>
               <div className="col-span-2 text-right">Timestamp</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
               {filteredLogs.map(log => (
                  <div
                     key={log.id}
                     onClick={() => setSelectedLogId(log.id)}
                     className={`
                    grid grid-cols-12 px-4 py-3 rounded-xl cursor-pointer transition-all items-center group
                    ${selectedLogId === log.id
                           ? 'bg-blue-600/10 border border-blue-500/30'
                           : 'border border-transparent hover:bg-white/5'
                        }
                 `}
                  >
                     <div className="col-span-5 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.status === 'resolved' ? 'bg-blue-500/20 text-blue-400' :
                           log.status === 'escalated' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                           }`}>
                           {log.status === 'resolved' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        </div>
                        <div className="min-w-0">
                           <h4 className={`text-sm font-medium truncate ${selectedLogId === log.id ? 'text-white' : 'text-white/80'}`}>{log.userQuery}</h4>
                        </div>
                     </div>

                     <div className="col-span-3 text-xs text-white/60">
                        <span className="px-2 py-1 bg-white/5 rounded-md border border-white/5">{log.department}</span>
                     </div>

                     <div className="col-span-2 text-xs text-white/60 font-mono">
                        {log.duration}
                     </div>

                     <div className="col-span-2 flex items-center justify-end gap-3">
                        <span className="text-xs text-white/40">{new Date(log.startTime).toLocaleTimeString()}</span>
                        <button
                           onClick={(e) => { e.stopPropagation(); toggleLogFlag(log.id); }}
                           className={`${log.isFlagged ? 'text-yellow-400' : 'text-white/10 opacity-0 group-hover:opacity-100 hover:text-white/60'}`}
                        >
                           <MoreHorizontal size={16} />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* RIGHT SIDEBAR (Details Panel) */}
         <AnimatePresence mode="wait">
            {selectedLog && (
               <Motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="hidden lg:flex flex-col bg-[#0c0c0e] rounded-[24px] border border-white/10 overflow-hidden shadow-2xl h-full"
               >
                  {/* Header */}
                  <div className="p-6 border-b border-white/10 flex flex-col items-center text-center relative bg-white/[0.02]">
                     <button onClick={() => setSelectedLogId(null)} className="absolute top-4 right-4 text-white/20 hover:text-white">
                        <XCircle size={18} />
                     </button>

                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/40 mb-4">
                        <Bot size={24} className="text-white" />
                     </div>
                     <h3 className="text-base font-medium text-white mb-1 line-clamp-1 w-full px-2">{selectedLog.userQuery}</h3>
                     <p className="text-xs text-white/40 mb-4">{selectedLog.id}</p>

                     <div className="flex w-full gap-2">
                        <button className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg text-xs font-medium text-white transition-colors border border-white/5" onClick={() => toggleLogFlag(selectedLog.id)}>
                           {selectedLog.isFlagged ? 'Unflag' : 'Flag for Review'}
                        </button>
                     </div>
                  </div>

                  {/* Chat Timeline */}
                  <div className="flex-1 flex flex-col min-h-0 bg-[#08080a]">
                     <div className="p-3 border-b border-white/5">
                        <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Transcript</h4>
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        {selectedLog.messages.map((msg, i) => (
                           <div key={i} className="relative pl-4 border-l border-white/10 ml-0.5">
                              <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-[#08080a] ${msg.role === 'user' ? 'bg-white' : 'bg-blue-500'}`} />

                              <div className="flex flex-col gap-1">
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white/90">{msg.role === 'user' ? 'Visitor' : 'AI'}</span>
                                    <span className="text-[10px] text-white/30">{msg.timestamp}</span>
                                 </div>
                                 <p className="text-xs text-white/60 leading-relaxed bg-white/5 p-2 rounded-lg rounded-tl-none">
                                    {msg.text}
                                 </p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </Motion.div>
            )}
         </AnimatePresence>

      </div>
   );
}

const TagBadge = ({ label, color }: { label: string, color: string }) => {
   const colors: any = {
      blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      red: 'bg-red-500/10 text-red-400 border-red-500/20',
      gray: 'bg-white/5 text-white/60 border-white/10',
   };
   return (
      <span className={`px-2 py-1 rounded-md text-[10px] font-medium border ${colors[color] || colors.gray}`}>
         {label}
      </span>
   )
}

// --- SETTINGS VIEW ---
function SettingsView() {
   const { settings, updateSettings } = useKiosk();
   const videoRef = useRef<HTMLVideoElement>(null);
   const [videoActive, setVideoActive] = useState(false);

   // Interactive Zone Editing State
   const [editZoneMode, setEditZoneMode] = useState(false);
   const zoneContainerRef = useRef<HTMLDivElement>(null);
   const [dragStart, setDragStart] = useState<{
      mode: 'move' | 'resize';
      mouseX: number;
      mouseY: number;
      initialZone: { x: number, y: number, w: number, h: number };
   } | null>(null);

   // Initialize Camera
   useEffect(() => {
      let stream: MediaStream | null = null;
      const startCamera = async () => {
         try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
               videoRef.current.srcObject = stream;
               setVideoActive(true);
            }
         } catch (err) {
            console.error("Camera access denied or unavailable", err);
            setVideoActive(false);
         }
      };
      startCamera();
      return () => {
         if (stream) stream.getTracks().forEach(track => track.stop());
      };
   }, []);

   // Drag & Drop Logic for Zone
   useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
         if (!dragStart || !zoneContainerRef.current) return;

         const rect = zoneContainerRef.current.getBoundingClientRect();
         // Calculate movement in percentage relative to container size
         const deltaX = ((e.clientX - dragStart.mouseX) / rect.width) * 100;
         const deltaY = ((e.clientY - dragStart.mouseY) / rect.height) * 100;

         let newZone = { ...dragStart.initialZone };

         if (dragStart.mode === 'move') {
            // Update Position (Clamp to boundaries)
            newZone.x = Math.max(0, Math.min(100 - newZone.w, newZone.x + deltaX));
            newZone.y = Math.max(0, Math.min(100 - newZone.h, newZone.y + deltaY));
         } else if (dragStart.mode === 'resize') {
            // Update Size (Clamp to boundaries and min size 10%)
            newZone.w = Math.max(10, Math.min(100 - newZone.x, newZone.w + deltaX));
            newZone.h = Math.max(10, Math.min(100 - newZone.y, newZone.h + deltaY));
         }

         updateSettings({ detectionZone: newZone });
      };

      const handleMouseUp = () => {
         setDragStart(null);
      };

      if (dragStart) {
         window.addEventListener('mousemove', handleMouseMove);
         window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
         window.removeEventListener('mousemove', handleMouseMove);
         window.removeEventListener('mouseup', handleMouseUp);
      };
   }, [dragStart, updateSettings]);

   const startDrag = (e: React.MouseEvent, mode: 'move' | 'resize') => {
      e.stopPropagation();
      e.preventDefault();
      setDragStart({
         mode,
         mouseX: e.clientX,
         mouseY: e.clientY,
         initialZone: { ...settings.detectionZone }
      });
   };

   return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

         {/* LEFT COL: BRAIN (AI) */}
         <div className="space-y-8">
            <section className="space-y-4">
               <h3 className="text-xl font-medium text-white flex items-center gap-2">
                  <Cpu className="text-blue-400" /> Neural Core
               </h3>
               {/* Persona */}
               <GlassCard className="p-6">
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">System Persona</label>
                  <textarea
                     value={settings.systemPrompt}
                     onChange={e => updateSettings({ systemPrompt: e.target.value })}
                     className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500 resize-none font-mono"
                     placeholder="You are Persona..."
                  />
                  <div className="flex justify-end mt-2">
                     <span className="text-[10px] text-white/30">Tokens: ~450</span>
                  </div>
               </GlassCard>

               {/* Voice */}
               <GlassCard className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                     <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Vocal Synthesis</label>
                     <Volume2 size={16} className="text-white/40" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <span className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Voice Model</span>
                        <div className="relative">
                           <select
                              value={settings.voiceId}
                              onChange={e => updateSettings({ voiceId: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-sm text-white appearance-none cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:border-blue-500"
                           >
                              <option value="shimmer" className="bg-slate-900">Shimmer (Female)</option>
                              <option value="alloy" className="bg-slate-900">Alloy (Male)</option>
                              <option value="echo" className="bg-slate-900">Echo (Male)</option>
                              <option value="onyx" className="bg-slate-900">Onyx (Deep Male)</option>
                           </select>
                           <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-white/40 pointer-events-none" size={16} />
                        </div>
                     </div>

                     <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <span className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Language</span>
                        <div className="relative">
                           <select
                              value={settings.language}
                              onChange={e => updateSettings({ language: e.target.value as any })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-sm text-white appearance-none cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:border-blue-500"
                           >
                              <option value="en" className="bg-slate-900">English (US)</option>
                           </select>
                           <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-white/40 pointer-events-none" size={16} />
                        </div>
                     </div>
                  </div>

                  <div>
                     <div className="flex justify-between mb-2">
                        <span className="text-sm text-white/80">Speech Rate</span>
                        <span className="text-xs text-white/50">{settings.speechSpeed}x</span>
                     </div>
                     <input
                        type="range" min="0.5" max="2.0" step="0.1"
                        value={settings.speechSpeed}
                        onChange={e => updateSettings({ speechSpeed: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                     />
                  </div>
               </GlassCard>
            </section>
         </div>

         {/* RIGHT COL: SENSES (Hardware/Calibration) */}
         <div className="space-y-8">
            <section className="space-y-4">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-medium text-white flex items-center gap-2">
                     <ScanFace className="text-purple-400" /> Perception Calibration
                  </h3>
                  {/* Toggle Editing Mode */}
                  <button
                     onClick={() => setEditZoneMode(!editZoneMode)}
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${editZoneMode
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'bg-black/50 text-white border-white/20 hover:bg-black/70'
                        }`}
                  >
                     {editZoneMode ? <CheckCircle2 size={14} /> : <Move size={14} />}
                     {editZoneMode ? 'Done Editing' : 'Adjust Zone'}
                  </button>
               </div>

               {/* Detection Visualizer */}
               <GlassCard className="p-0 overflow-hidden relative group select-none">
                  <div
                     ref={zoneContainerRef}
                     className="h-64 bg-black relative flex items-center justify-center overflow-hidden"
                  >
                     <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                     {/* Real Camera Feed */}
                     <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
                     />

                     {!videoActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 z-10 pointer-events-none">
                           <Camera size={32} className="mb-2 opacity-50" />
                           <p className="text-xs font-mono uppercase tracking-widest">NO CAMERA FEED</p>
                        </div>
                     )}

                     {videoActive && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 z-10 pointer-events-none">
                           <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]" />
                           <span className="text-[10px] text-red-500 font-bold tracking-widest">LIVE FEED</span>
                        </div>
                     )}

                     {/* The Interactive Zone Box */}
                     <div
                        className={`absolute rounded-lg flex items-center justify-center backdrop-blur-[0px] shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-colors
                       ${editZoneMode
                              ? 'border-2 border-emerald-400 bg-emerald-500/20 cursor-move'
                              : 'border-2 border-emerald-500/80 bg-emerald-500/10 pointer-events-none'
                           }
                    `}
                        style={{
                           left: `${settings.detectionZone.x}%`,
                           top: `${settings.detectionZone.y}%`,
                           width: `${settings.detectionZone.w}%`,
                           height: `${settings.detectionZone.h}%`,
                        }}
                        onMouseDown={(e) => editZoneMode && startDrag(e, 'move')}
                     >
                        {/* Move Label (Only visible when dragging or hovering in edit mode) */}
                        {editZoneMode && (
                           <div className="text-emerald-300 opacity-50 pointer-events-none">
                              <Move size={24} />
                           </div>
                        )}

                        {!editZoneMode && (
                           <>
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 rounded text-[9px] font-bold text-black uppercase whitespace-nowrap">Active Zone</div>
                              <User size={32} className="text-emerald-500/50" />
                           </>
                        )}

                        {/* Resize Handle (Bottom Right) */}
                        {editZoneMode && (
                           <div
                              className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 cursor-se-resize flex items-center justify-center rounded-tl-lg hover:scale-110 transition-transform"
                              onMouseDown={(e) => startDrag(e, 'resize')}
                           >
                              <Maximize size={12} className="text-black rotate-90" />
                           </div>
                        )}
                     </div>

                     {/* Overlay for "Edit Mode" Help Text */}
                     {editZoneMode && (
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg pointer-events-none">
                           <p className="text-[10px] text-emerald-400 font-medium">Drag box to move • Drag corner to resize</p>
                        </div>
                     )}

                  </div>

                  {/* Controls for Visualizer */}
                  <div className="p-6 border-t border-white/5 space-y-6 bg-white/[0.02]">
                     <div>
                        <div className="flex justify-between mb-2">
                           <span className="text-sm text-white/80">Motion Sensitivity</span>
                           <span className="text-xs text-white/50">{(settings.sensitivity * 100).toFixed(0)}%</span>
                        </div>
                        <input
                           type="range" min="0" max="1" step="0.1"
                           value={settings.sensitivity}
                           onChange={e => updateSettings({ sensitivity: parseFloat(e.target.value) })}
                           className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                     </div>
                     <div>
                        <div className="flex justify-between mb-2">
                           <span className="text-sm text-white/80">Presence Timeout</span>
                           <span className="text-xs text-white/50">{settings.presenceTimeout}s</span>
                        </div>
                        <input
                           type="range" min="5" max="60" step="5"
                           value={settings.presenceTimeout}
                           onChange={e => updateSettings({ presenceTimeout: parseInt(e.target.value) })}
                           className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                     </div>
                  </div>
               </GlassCard>

               {/* API Health */}
               <GlassCard className="p-6">
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-4">System Status</label>
                  <div className="space-y-3">
                     <StatusRow label="OpenAI API" active={true} />
                     <StatusRow label="Speech Services" active={true} />
                     <StatusRow label="Internet Connectivity" active={true} />
                  </div>
               </GlassCard>
            </section>
         </div>

         {/* Floating Save Button */}
         <div className="fixed bottom-6 right-6 lg:right-10 z-50">
            <button className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-bold tracking-wide shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95">
               <Save size={20} /> SAVE CONFIGURATION
            </button>
         </div>
      </div>
   )
}
