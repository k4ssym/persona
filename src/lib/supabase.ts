
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nmvqzzbyeksjhisishiu.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_psqetFJfLvd-7-Qv1Zm7fA_ILtiU8xg';

export const supabase = createClient(supabaseUrl, supabaseKey);
