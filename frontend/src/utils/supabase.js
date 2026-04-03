import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Para debugging
console.log('✅ Supabase client inicializado');
console.log('URL:', supabaseUrl);
