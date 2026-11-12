import { supabase } from '../lib/supabase';

async function checkFK() {
  console.log('=== Checking Foreign Key details for project_manager_id ===');

  // Query PostgreSQL catalog for foreign key constraint details
  const { data, error } = await supabase.rpc('get_foreign_keys');

  if (error) {
    console.log('RPC get_foreign_keys error (trying direct sql or catalog query):', error.message);
  }

  // Let's test inserting a UUID into project_manager_id to see exact Postgres constraint message
  const { data: testProj } = await supabase
    .from('pm_projects')
    .select('id')
    .limit(1)
    .single();

  if (testProj) {
    const { error: testErr } = await supabase
      .from('pm_projects')
      .update({ project_manager_id: '00000000-0000-0000-0000-000000000000' })
      .eq('id', testProj.id);

    console.log('Test update error:', testErr);
  }
}

checkFK();
