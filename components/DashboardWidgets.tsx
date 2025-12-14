import React, { useState } from 'react';
import { Calendar, Zap, Plane, CheckCircle2, Circle, ChevronRight, BarChart3, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix: Cast motion to any to prevent TypeScript errors
import { useKiosk } from '../context/KioskContext';
const Motion = motion as any;

// --- Reusable Widget Container ---
const WidgetCard = ({ title, icon: Icon, children, delay, className = "", onClick }: any) => (
   <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ delay, duration: 0.5 }}
      onClick={onClick}
      className={`
      relative p-6 rounded-[32px] bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-2xl 
      flex flex-col gap-4 overflow-hidden group pointer-events-auto transition-all duration-300
      hover:bg-white/[0.08] hover:border-white/20 hover:shadow-blue-900/10
      ${className}
    `}
   >
      {/* Header */}
      <div className="flex items-center justify-between text-white/50 group-hover:text-white/90 transition-colors">
         <div className="flex items-center gap-2">
            {Icon && <Icon size={14} />}
            <span className="text-[11px] font-bold tracking-widest uppercase">{title}</span>
         </div>
         <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-grow h-full">
         {children}
      </div>
   </Motion.div>
);

export default function DashboardWidgets() {
   const { t } = useKiosk();
   // --- STATE 1: TASKS ---
   const [tasks, setTasks] = useState([
      { id: 1, title: "Review Q3 Strategy", time: "10:00 AM", done: false },
      { id: 2, title: "Client Call: TechCorp", time: "11:30 AM", done: false },
      { id: 3, title: "Team Lunch", time: "01:00 PM", done: true }
   ]);

   const toggleTask = (id: number) => {
      setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
   };

   // --- STATE 2: INSIGHTS ---
   const metrics = [
      { label: t('Productivity'), value: 92, unit: "%", desc: "Top 5% of week" },
      { label: t('FocusTime'), value: 4.5, unit: "hrs", desc: "30m above avg" },
      { label: t('TasksDone'), value: 12, unit: "", desc: "On track" }
   ];
   const [metricIndex, setMetricIndex] = useState(0);

   const cycleMetric = () => {
      setMetricIndex((prev) => (prev + 1) % metrics.length);
   };

   // --- STATE 3: VACATION ---
   const [vacationView, setVacationView] = useState<'days' | 'hours'>('days');
   const vacationData = {
      days: { total: 20, used: 8, label: t('DaysLeft') },
      hours: { total: 160, used: 64, label: t('HoursLeft') }
   };

   const toggleVacationView = () => {
      setVacationView(prev => prev === 'days' ? 'hours' : 'days');
   };

   const currentMetric = metrics[metricIndex];
   const currentVacation = vacationData[vacationView];
   const vacationRemaining = currentVacation.total - currentVacation.used;
   const vacationPercent = currentVacation.used / currentVacation.total;

   return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[1200px] mx-auto relative px-4 h-auto md:h-[280px]">

         {/* 1. Interactive Schedule */}
         <WidgetCard title={t('TodayTasks')} icon={Calendar} delay={0.1}>
            <div className="flex flex-col h-full gap-2.5 pt-1 overflow-y-auto custom-scrollbar">
               {tasks.map((task, i) => (
                  <div
                     key={task.id}
                     onClick={(e: any) => { e.stopPropagation(); toggleTask(task.id); }}
                     className={`
                   group/item flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 cursor-pointer border
                   ${task.done
                           ? 'bg-white/[0.02] border-transparent opacity-50'
                           : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }
                 `}
                  >
                     <div className={`
                    flex items-center justify-center w-5 h-5 rounded-full border transition-colors
                    ${task.done
                           ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                           : 'border-white/30 text-transparent group-hover/item:border-white/60'
                        }
                  `}>
                        <CheckCircle2 size={12} className={task.done ? 'scale-100' : 'scale-0'} />
                     </div>

                     <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium text-white truncate transition-all ${task.done ? 'line-through text-white/30' : ''}`}>
                           {task.title}
                        </h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">{task.time}</p>
                     </div>
                  </div>
               ))}
            </div>
         </WidgetCard>

         {/* 2. Cyclable Insights */}
         <WidgetCard title={t('LiveInsights')} icon={Zap} delay={0.2} onClick={cycleMetric} className="cursor-pointer">
            <AnimatePresence mode="wait">
               <Motion.div
                  key={metricIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col justify-between h-full py-2"
               >
                  <div>
                     <div className="flex items-baseline gap-1">
                        <span className="text-6xl font-light text-white tracking-tighter">{currentMetric.value}</span>
                        <span className="text-2xl text-white/40 font-light">{currentMetric.unit}</span>
                     </div>
                     <p className="text-white/60 text-sm font-medium mt-1">{currentMetric.label}</p>
                  </div>

                  <div className="space-y-4">
                     <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <Motion.div
                           initial={{ width: 0 }}
                           animate={{ width: `${Math.min(currentMetric.value, 100)}%` }}
                           transition={{ duration: 1, ease: "easeOut" }}
                           className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                        />
                     </div>
                     <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <BarChart3 size={14} className="text-emerald-400" />
                        <p className="text-xs text-white/70">
                           <span className="text-white font-semibold">{currentMetric.desc}</span>
                        </p>
                     </div>
                  </div>
               </Motion.div>
            </AnimatePresence>

            {/* Pagination Dots */}
            <div className="absolute top-7 right-7 flex gap-1">
               {metrics.map((_, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === metricIndex ? 'bg-white' : 'bg-white/20'}`} />
               ))}
            </div>
         </WidgetCard>

         {/* 3. Toggleable Vacation Tracker */}
         <WidgetCard title={t('Balance')} icon={Plane} delay={0.3} onClick={toggleVacationView} className="cursor-pointer">
            <div className="flex flex-col items-center justify-center h-full relative">

               {/* Toggle Switch */}
               <div className="absolute top-0 right-0 flex bg-white/5 rounded-lg p-0.5 border border-white/5">
                  <div className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${vacationView === 'days' ? 'bg-white text-black' : 'text-white/40'}`}>{t('DAYS')}</div>
                  <div className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${vacationView === 'hours' ? 'bg-white text-black' : 'text-white/40'}`}>{t('HRS')}</div>
               </div>

               <div className="relative w-44 h-44 mt-4">
                  {/* Background Circle */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                     {/* Progress Circle */}
                     <Motion.circle
                        key={vacationView} // Re-animate on toggle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke="url(#vacation-gradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="263.89"
                        strokeDashoffset="263.89"
                        initial={{ strokeDashoffset: 263.89 }}
                        animate={{ strokeDashoffset: 263.89 * (1 - (1 - vacationPercent)) }} // Reverse logic for "Left"
                        transition={{ duration: 1.5, ease: "easeOut" }}
                     />
                     <defs>
                        <linearGradient id="vacation-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                           <stop offset="0%" stopColor="#f472b6" />
                           <stop offset="100%" stopColor="#c084fc" />
                        </linearGradient>
                     </defs>
                  </svg>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <Motion.div
                        key={vacationRemaining}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-5xl font-medium text-white tracking-tighter"
                     >
                        {vacationRemaining}
                     </Motion.div>
                     <div className="flex items-center gap-1.5 mt-1">
                        <Clock size={10} className="text-white/40" />
                        <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">{currentVacation.label}</span>
                     </div>
                  </div>
               </div>
            </div>
         </WidgetCard>

      </div>
   );
}