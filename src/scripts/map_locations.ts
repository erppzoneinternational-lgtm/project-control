import { supabase } from '../lib/supabase';

async function mapGovernoratesAndCities() {
  console.log('=== Fetching all projects from pm_projects ===');

  const { data: projects, error } = await supabase
    .from('pm_projects')
    .select('id, project_code, project_name, site_location_address, governorate_name_ar, governorate_name_en, governorate_id')
    .is('deleted_at', null);

  if (error || !projects) {
    console.error('Error fetching projects:', error);
    return;
  }

  console.log(`Processing ${projects.length} projects...`);

  // Mapping rules based on keywords found in site_location_address and project_name
  const getGovForLocation = (text: string): { ar: string; en: string; id?: string } => {
    const t = text.toLowerCase();

    if (t.includes('north coast') || t.includes('ساحل') || t.includes('مطروح') || t.includes('علمين') || t.includes('ضبعة') || t.includes('حكمة') || t.includes('عبد الرحمن') || t.includes('راس')) {
      return { ar: 'مطروح', en: 'Matrouh', id: 'gov_matrouh' };
    }
    if (t.includes('قاهرة جديدة') || t.includes('تجمع') || t.includes('عاصمة') || t.includes('مصر الجديدة') || t.includes('مدينة نصر') || t.includes('قاهرة') || t.includes('cairo')) {
      return { ar: 'القاهرة', en: 'Cairo', id: 'gov_cairo' };
    }
    if (t.includes('اكتوبر') || t.includes('أكتوبر') || t.includes('زايد') || t.includes('سوديك') || t.includes('جيزة') || t.includes('giza') || t.includes('october')) {
      return { ar: 'الجيزة', en: 'Giza', id: 'gov_giza' };
    }
    if (t.includes('جونة') || t.includes('غردقة') || t.includes('بحر احمر') || t.includes('بحر أحمر') || t.includes('حشيش') || t.includes('red sea') || t.includes('gouna')) {
      return { ar: 'البحر الأحمر', en: 'Red Sea', id: 'gov_redsea' };
    }
    if (t.includes('أقصر') || t.includes('اقصر') || t.includes('luxor')) {
      return { ar: 'الأقصر', en: 'Luxor', id: 'gov_luxor' };
    }
    if (t.includes('سخنة') || t.includes('سويس') || t.includes('suez')) {
      return { ar: 'السويس', en: 'Suez', id: 'gov_suez' };
    }

    return { ar: 'القاهرة', en: 'Cairo', id: 'gov_cairo' }; // Default fallback
  };

  let updatedCount = 0;

  for (const p of projects) {
    const locText = `${p.site_location_address || ''} ${p.project_name || ''}`;
    const gov = getGovForLocation(locText);

    console.log(`📌 [#${p.project_code}] Site: "${p.site_location_address || 'N/A'}" => Governorate: "${gov.ar} (${gov.en})"`);

    const { error: updErr } = await supabase
      .from('pm_projects')
      .update({
        governorate_name_ar: gov.ar,
        governorate_name_en: gov.en,
      })
      .eq('id', p.id);

    if (!updErr) {
      updatedCount++;
    } else {
      console.error(`  ❌ Error updating project #${p.project_code}:`, updErr.message);
    }
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} project governorates in Database!`);
}

mapGovernoratesAndCities();
