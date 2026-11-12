import { supabase } from '../lib/supabase';

async function checkEnv() {
  console.log('ENV KEYS:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('POSTGRES') || k.includes('DATABASE') || k.includes('DB')));
  
  // Test if exec_sql RPC exists
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });
  console.log('rpc exec_sql result:', { data, error });
}

checkEnv();
