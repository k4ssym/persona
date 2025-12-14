import React from 'react';
import HardwareHealth from '../../components/admin/HardwareHealth';
import ConversationLogs from '../../components/admin/ConversationLogs';
import AdminDashboardWidgets from '../../components/admin/DashboardWidgets';
import SystemConfig from '../../components/admin/SystemConfig';
import { 
  Search, Bell, Plus, Calendar, ArrowUpRight, MoreHorizontal, Lock, 
  Mic, Video, Wifi, Activity, Clock 
} from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="p-8 md:p-10 max-w-[1600px] mx-auto min-h-screen">
      
      {/* 1. Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Dashboard</h1>
          <p className="text-slate-400 mt-1 font-medium">Monitoring Kiosk Performance</p>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Search Bar */}
           <div className="hidden md:flex items-center gap-3 px-5 py-3 bg-white rounded-full border border-slate-200 shadow-sm w-80">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Search logs, errors..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400" />
           </div>
           
           {/* Actions */}
           <button className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:shadow-md transition-all relative">
              <Bell size={20} />
              <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
           </button>
           <button className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:shadow-lg hover:shadow-black/20 transition-all">
              <Plus size={20} />
           </button>
           
           {/* Profile */}
           <div className="hidden md:flex items-center gap-3 ml-2 pl-6 border-l border-slate-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
              <div>
                 <p className="text-sm font-bold text-slate-900">Admin User</p>
                 <p className="text-xs text-slate-400">Technician</p>
              </div>
           </div>
        </div>
      </header>

      {/* 2. Hero Action Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 font-bold text-lg shadow-sm">
               19
            </div>
            <div>
               <p className="text-slate-900 font-bold">Tue, December</p>
               <p className="text-slate-400 text-xs font-medium">System Uptime: 4d 12h</p>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-[#FF6B6B] text-white rounded-full font-semibold shadow-lg shadow-red-500/20 hover:scale-105 transition-transform">
               <span>Emergency Stop</span>
               <ArrowUpRight size={18} />
            </button>
            <button className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600">
               <Calendar size={18} />
            </button>
         </div>

         <div className="hidden lg:block text-right">
            <h2 className="text-2xl font-bold text-slate-900">System <span className="text-slate-400">Normal</span></h2>
            <p className="text-slate-400">AI Latency: 45ms</p>
         </div>
      </div>

      {/* 3. Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
         
         {/* -- COL 1: Hardware Card -- */}
         <div className="col-span-12 md:col-span-4 xl:col-span-3">
            <div className="bg-black text-white p-6 rounded-[32px] shadow-2xl shadow-black/20 h-full relative overflow-hidden flex flex-col justify-between min-h-[240px]">
               {/* Background Decor */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
               
               <div className="flex justify-between items-start relative z-10">
                  <div>
                     <p className="text-white/60 text-xs font-bold tracking-widest uppercase">Hardware Status</p>
                     <h3 className="text-2xl font-medium mt-1">Online</h3>
                  </div>
                  <Wifi size={24} className="text-emerald-400" />
               </div>

               <div className="flex items-center gap-4 my-6 relative z-10">
                  <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-md">
                     <Mic size={20} className="mb-2 text-white/80" />
                     <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-md">
                     <Video size={20} className="mb-2 text-white/80" />
                     <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
               </div>

               <div className="flex justify-between items-end relative z-10">
                  <div>
                     <p className="text-white/40 text-[10px] uppercase">Device ID</p>
                     <p className="font-mono text-lg tracking-widest">**** 2719</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                     <Activity size={14} />
                  </div>
               </div>
            </div>
         </div>

         {/* -- COL 2: Stats (Real Data) -- */}
         <div className="col-span-12 md:col-span-4 xl:col-span-3 flex flex-col gap-6">
            <AdminDashboardWidgets />
         </div>

         {/* -- COL 3: System Lock & Widgets -- */}
         <div className="col-span-12 md:col-span-4 xl:col-span-2 flex flex-col gap-6">
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex-1 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors group">
                 <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-600 mb-3 transition-colors">
                    <Lock size={20} />
                 </div>
                 <p className="font-bold text-slate-900">System Lock</p>
                 <p className="text-xs text-slate-400">Tap to secure</p>
             </div>
             
             <div className="bg-black text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden flex-1 flex items-center justify-center">
                 <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 opacity-20" />
                 <div className="relative z-10 text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-emerald-400 mx-auto mb-2 flex items-center justify-center">
                       <span className="text-xs font-bold">98%</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wide">Health</p>
                 </div>
             </div>
         </div>

         {/* -- COL 4: Calendar / Mini Graph -- */}
         <div className="col-span-12 xl:col-span-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <Clock size={20} className="text-slate-400" />
                <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg text-slate-600">30 Days</span>
             </div>
             <div className="space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 text-center">
                       <p className="text-xs font-bold text-slate-400">Mon</p>
                       <p className="text-sm font-bold text-slate-900">12</p>
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-slate-900 w-[70%] rounded-full" />
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-12 text-center">
                       <p className="text-xs font-bold text-slate-400">Tue</p>
                       <p className="text-sm font-bold text-slate-900">13</p>
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-[#FF6B6B] w-[40%] rounded-full" />
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-12 text-center">
                       <p className="text-xs font-bold text-slate-400">Wed</p>
                       <p className="text-sm font-bold text-slate-900">14</p>
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-400 w-[90%] rounded-full" />
                    </div>
                 </div>
             </div>
         </div>

         {/* -- ROW 2: Activity Manager (Logs) & Config -- */}
         
         {/* Logs List */}
         <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm min-h-[400px]">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-bold text-xl text-slate-900">Activity Manager</h3>
               <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-full bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200">Team</button>
                  <button className="px-4 py-2 rounded-full bg-black text-xs font-bold text-white shadow-lg shadow-black/20">System</button>
               </div>
            </div>
            
            <div className="h-[300px] overflow-auto">
               <ConversationLogs />
            </div>
         </div>

         {/* Configuration / Prompt */}
         <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-xl text-slate-900">Business Logic</h3>
               <MoreHorizontal size={20} className="text-slate-300" />
            </div>
            
            <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
               <SystemConfig />
            </div>

            <button className="w-full py-4 bg-[#FF6B6B] text-white rounded-2xl font-bold shadow-xl shadow-red-500/20 hover:scale-[1.02] transition-transform">
               Deploy Configuration
            </button>
         </div>

      </div>
    </div>
  );
}