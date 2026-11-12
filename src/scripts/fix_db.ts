import { supabase } from '../lib/supabase';

async function updatePMNames() {
  console.log('=== Step 2: Updating Full Official PM Names in pm_projects ===');

  const { data: projects } = await supabase
    .from('pm_projects')
    .select('id, project_code, project_manager_name_raw')
    .is('deleted_at', null);

  const { data: stakeholders } = await supabase
    .from('stakeholders')
    .select('id, name, job_title');

  if (!projects || !stakeholders) return;

  const normalize = (str: string) =>
    (str || '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ه/g, 'ة')
      .replace(/\s+/g, ' ')
      .trim();

  let updatedCount = 0;

  for (const p of projects) {
    const raw = (p.project_manager_name_raw || '').trim();
    if (!raw || raw === 'بدون') continue;

    const normRaw = normalize(raw);
    const rawTokens = normRaw.split(' ').filter(Boolean);

    // Find best match in stakeholders
    const match = stakeholders.find((st: any) => {
      const normStName = normalize(st.name);
      return rawTokens.every((token) => normStName.includes(token));
    });

    if (match && match.name !== raw) {
      console.log(`✨ Updating PM Name [#${p.project_code}]: "${raw}" => "${match.name}"`);

      const { error } = await supabase
        .from('pm_projects')
        .update({
          project_manager_name_raw: match.name,
        })
        .eq('id', p.id);

      if (!error) updatedCount++;
      else console.error(`  ❌ Failed to update PM name for #${p.project_code}:`, error.message);
    }
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} Project Manager names in Database!`);
}

updatePMNames();
