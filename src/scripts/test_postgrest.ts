import { supabase } from '../lib/supabase';

async function testPostgrestAccess() {
  console.log('--- Testing PostgREST view access ---');
  
  const { data: stFull, error: errFull } = await supabase
    .from('stakeholders_full')
    .select('id, name, organization_name, stakeholder_kind, assigned_projects_count')
    .limit(5);

  console.log('stakeholders_full err:', errFull);
  console.log('stakeholders_full sample 5:', stFull);

  const { data: stReg, error: errReg } = await supabase
    .from('stakeholder_project_register')
    .select('*')
    .limit(5);

  console.log('stakeholder_project_register err:', errReg);
  console.log('stakeholder_project_register sample:', stReg);

  const { data: orgs, error: errOrgs } = await supabase
    .from('organizations')
    .select('*');

  console.log('organizations err:', errOrgs);
  console.log('organizations data:', orgs);
}

testPostgrestAccess();
