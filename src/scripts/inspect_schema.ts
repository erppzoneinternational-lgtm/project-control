import { supabase } from '../lib/supabase';

async function inspectSchema() {
  console.log('--- Checking stakeholders count & schema ---');
  const { data: st, error: stErr, count: stCount } = await supabase
    .from('stakeholders')
    .select('*', { count: 'exact' });
  
  console.log('stakeholders error:', stErr);
  console.log('stakeholders count:', stCount, 'data length:', st?.length);
  if (st && st.length > 0) {
    console.log('stakeholders sample row 0 keys:', Object.keys(st[0]));
    console.log('sample row 0:', st[0]);
  }

  console.log('\n--- Checking clients table ---');
  const { data: cl, error: clErr } = await supabase.from('clients').select('*').limit(1);
  console.log('clients err:', clErr);
  if (cl && cl.length > 0) console.log('clients sample keys:', Object.keys(cl[0]));

  console.log('\n--- Checking vendors table ---');
  const { data: vn, error: vnErr } = await supabase.from('vendors').select('*').limit(1);
  console.log('vendors err:', vnErr);
  if (vn && vn.length > 0) console.log('vendors sample keys:', Object.keys(vn[0]));

  console.log('\n--- Checking organizations table ---');
  const { data: org, error: orgErr } = await supabase.from('organizations').select('*');
  console.log('organizations err:', orgErr, 'data:', org);

  console.log('\n--- Checking project_stakeholders table ---');
  const { data: ps, error: psErr } = await supabase.from('project_stakeholders').select('*');
  console.log('project_stakeholders err:', psErr, 'data:', ps);
}

inspectSchema();
