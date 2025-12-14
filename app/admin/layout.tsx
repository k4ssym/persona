'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { LayoutGrid, Settings, Activity, ArrowLeft, ShieldCheck, Users, FileText, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-24 md:w-64 bg-white border-r border-slate-200 flex flex-col py-8 transition-all duration-300">
        <div className="px-6 mb-12 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-xl">
             <ShieldCheck size={20} />
          </div>
          <span className="hidden md:block font-bold text-lg tracking-tight">AdminOS</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
           <NavItem icon={LayoutGrid} label="Dashboard" active />
           <NavItem icon={Users} label="Technicians" />
           <NavItem icon={FileText} label="Logs" />
           <NavItem icon={Activity} label="Analytics" />
           <div className="my-6 border-b border-slate-100" />
           <NavItem icon={Settings} label="Settings" />
        </nav>

        <div className="px-4 mt-auto space-y-2">
          <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden md:block text-sm font-medium">Exit Kiosk</span>
          </a>
          
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all group"
          >
            <LogOut size={20} />
            <span className="hidden md:block text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>
    </div>
  );
}

const NavItem = ({ icon: Icon, label, active = false }: any) => (
  <a href="#" className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${active ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
    <Icon size={20} />
    <span className="hidden md:block text-sm font-medium">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white hidden md:block" />}
  </a>
);