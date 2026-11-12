import { supabase } from '../lib/supabase';

async function checkProfiles() {
  console.log('=== Checking profiles table ===');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Profiles table error:', error);
  } else {
    console.log(`Found ${profiles?.length} profiles in Supabase:`, profiles);
  }
}

checkProfiles();
