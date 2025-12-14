'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Lock, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import AuroraBackground from '../../components/AuroraBackground'; // Reusing your existing background

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize Supabase Client for the browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push('/admin');
      router.refresh(); // Refresh to ensure middleware/layout picks up new session
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-sans">
      {/* Background */}
      <AuroraBackground />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 m-4">
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-4">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Access</h1>
            <p className="text-white/40 text-sm mt-2">Restricted Area. Authorized Personnel Only.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Identity</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                placeholder="admin@propulso.ai"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Passkey</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                <p className="text-red-400 text-xs font-medium">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full group relative flex items-center justify-center gap-2 bg-white text-black font-bold py-4 rounded-xl shadow-xl shadow-white/10 hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>Authenticate</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
             <div className="flex items-center justify-center gap-2 text-white/20 text-[10px] uppercase tracking-widest">
                <Lock size={12} />
                <span>End-to-End Encrypted</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}