import { supabase } from '../lib/supabase';

async function matchAndUpdate() {
  console.log('=== Fetching all employees from stakeholders table ===');
  const { data: employees, error: empErr } = await supabase
    .from('stakeholders')
    .select('*');

  if (empErr) {
    console.error('Error fetching stakeholders:', empErr);
    return;
  }

  console.log(`Found ${employees?.length} total employee records in stakeholders table.`);

  console.log('\n=== Fetching all pm_projects ===');
  const { data: projects, error: projErr } = await supabase
    .from('pm_projects')
    .select('id, project_code, project_name, project_manager_name_raw, project_manager_id')
    .is('deleted_at', null);

  if (projErr || !projects) {
    console.error('Error fetching projects:', projErr);
    return;
  }

  console.log(`Found ${projects.length} projects.`);

  // Clean name helper
  const clean = (str: string) =>
    (str || '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ه/g, 'ة')
      .trim();

  let matchedCount = 0;
  let unMatchedCount = 0;

  for (const p of projects) {
    const raw = p.project_manager_name_raw?.trim() || '';
    if (!raw || raw === 'بدون') {
      continue;
    }

    const cleanRaw = clean(raw);
    const rawParts = cleanRaw.split(/\s+/).filter(Boolean);

    // Find best matching employee
    const matches = employees?.filter((emp: any) => {
      const cleanEmpName = clean(emp.name);
      // Check if all parts of raw short name exist in full name
      return rawParts.every((part) => cleanEmpName.includes(part));
    });

    if (matches && matches.length > 0) {
      const bestMatch = matches[0];
      matchedCount++;
      console.log(
        `✅ MATCH FOUND [#${p.project_code}]: "${raw}" => Full Name: "${bestMatch.name}" (ID: ${bestMatch.id})`
      );

      // Perform update on Supabase
      const { error: updateErr } = await supabase
        .from('pm_projects')
        .update({
          project_manager_id: bestMatch.id,
          project_manager_name_raw: bestMatch.name,
        })
        .eq('id', p.id);

      if (updateErr) {
        console.error(`  ❌ Update error for project #${p.project_code}:`, updateErr.message);
      } else {
        console.log(`  🎉 Updated DB row #${p.project_code} successfully!`);
      }
    } else {
      unMatchedCount++;
      console.log(`⚠️ NO MATCH FOUND [#${p.project_code}]: "${raw}"`);
    }
  }

  console.log(`\n=== Migration Summary ===`);
  console.log(`Total Matched & Updated in Database: ${matchedCount}`);
  console.log(`Total Unmatched / Manual Check: ${unMatchedCount}`);
}

matchAndUpdate();
