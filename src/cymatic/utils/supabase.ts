/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Supabase Client Utility
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sutaensdqobetxldxatd.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_-Iii34MXCXQKTMo-fXfU1g_Lieei1eV';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});
