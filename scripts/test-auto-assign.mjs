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

async function testAssign() {
  const projectId = 'c300cacc-7705-488a-b780-4b766ed39556';
  
  // Try to find the director
  const { data: stk, error: findError } = await supabase
    .from('stakeholders')
    .select('id, name')
    .or('name.ilike.%الشيخ%,email.ilike.%alshaikhm%,job_title.ilike.%Deputy General%')
    .limit(1)
    .maybeSingle();

  if (findError) {
    console.error("Find Error:", findError);
    return;
  }
  
  console.log("Found Mahdy El-Sheikh:", stk);
  
  if (stk) {
    // Delete existing to test fresh insert
    await supabase
      .from('project_stakeholders')
      .delete()
      .eq('project_id', projectId)
      .eq('stakeholder_id', stk.id);

    console.log("Deleted old assignment if any. Now inserting...");
    
    const { data: inserted, error: insertError } = await supabase
      .from('project_stakeholders')
      .insert({
        project_id: projectId,
        stakeholder_id: stk.id,
        project_role: 'مدير المشروعات',
        raci_role: 'informed',
        organization_id: '00000000-0000-0000-0000-000000000001'
      })
      .select('*');

    if (insertError) {
      console.error("Insert Error:", insertError);
    } else {
      console.log("Inserted Successfully:", inserted);
    }
  }
}

testAssign();
