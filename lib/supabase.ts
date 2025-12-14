
import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars on import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in .env.local");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');