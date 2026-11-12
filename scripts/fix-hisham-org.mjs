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

async function performFix() {
  console.log("1. Renaming default organization to Pzoneinternational...");
  const { error: orgErr } = await supabase
    .from('organizations')
    .update({
      name: 'Pzoneinternational',
      name_ar: 'Pzoneinternational',
      code: 'PZONE'
    })
    .eq('id', '00000000-0000-0000-0000-000000000001');

  if (orgErr) {
    console.error("Error updating default org name:", orgErr);
    return;
  }
  console.log("Success: Default organization renamed.");

  console.log("2. Inserting Emaar organization for client reps...");
  // Try inserting Emaar
  const { data: newOrg, error: insertOrgErr } = await supabase
    .from('organizations')
    .insert({
      name: 'Emaar',
      name_ar: 'إعمار',
      code: 'EMAAR',
      org_type: 'client'
    })
    .select('*')
    .maybeSingle();

  let emaarId = '';
  if (insertOrgErr) {
    // If it already exists or errors, let's query it
    console.log("Emaar might already exist, fetching Emaar...");
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('code', 'EMAAR')
      .maybeSingle();
    
    if (existingOrg) {
      emaarId = existingOrg.id;
    } else {
      console.error("Failed to insert or find Emaar organization:", insertOrgErr);
      return;
    }
  } else if (newOrg) {
    emaarId = newOrg.id;
  }

  console.log("Emaar Organization ID:", emaarId);

  if (emaarId) {
    console.log("3. Reassigning Hisham El-Safi to Emaar organization...");
    const { error: stkErr } = await supabase
      .from('stakeholders')
      .update({
        organization_id: emaarId
      })
      .eq('id', 'stk_1786376055745_8136');

    if (stkErr) {
      console.error("Error updating Hisham stakeholder organization:", stkErr);
    } else {
      console.log("Success: Hisham El-Safi is now associated with Emaar organization.");
    }
  }
}

performFix();
