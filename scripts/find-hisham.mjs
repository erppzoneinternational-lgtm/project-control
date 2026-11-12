import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findSheikh() {
  const { data, error } = await supabase
    .from('stakeholders')
    .select('*')
    .or('name.ilike.%شيخ%,name.ilike.%sheikh%,name.ilike.%mahdy%,name.ilike.%mahdi%');

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Stakeholders matching 'Sheikh' or 'Mahdy':", JSON.stringify(data, null, 2));
  }
}

findSheikh();
