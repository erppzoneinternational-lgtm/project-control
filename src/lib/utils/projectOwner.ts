import { Project } from '@/types';

/**
 * Returns the project owner / real estate developer.
 * Checks metadata first, then falls back to known project keywords, or 'غير محدد'.
 */
export function getOwnerFromProject(proj: Project | null | undefined): string {
  if (!proj) return 'غير محدد';
  if (proj.metadata?.owner_name) return proj.metadata.owner_name;
  
  const name = (proj.project_name || '') + ' ' + (proj.project_name_en || '');
  const lowerName = name.toLowerCase();

  if (lowerName.includes('soul')) return 'إعمار العقارية (Emaar)';
  if (lowerName.includes('cairo gate')) return 'إعمار العقارية (Emaar)';
  if (lowerName.includes('بلوم فيلدز') || lowerName.includes('bloomfields')) return 'تطوير مصر (Tatweer Misr)';
  if (lowerName.includes('البروج') || lowerName.includes('alburouj')) return 'شركة إمكان (Imkan)';
  if (lowerName.includes('سوان ليك') || lowerName.includes('swan lake')) return 'حسن علام العقارية (HAP)';
  if (lowerName.includes('لوكاندا') || lowerName.includes('locanda')) return 'حسن علام العقارية (HAP)';
  if (lowerName.includes('رأس الحكمة') || lowerName.includes('ras el hekma')) return 'أوراسكوم / أبوظبي التنموية (ADQ)';
  if (lowerName.includes('زويا') || lowerName.includes('zoya')) return 'LMD';
  if (lowerName.includes('اي سيتي') || lowerName.includes('i-city') || lowerName.includes('icity')) return 'ماونتن فيو (Mountain View)';
  if (lowerName.includes('ساراي') || lowerName.includes('sarai')) return 'مدينة مصر (Madinet Masr)';
  if (lowerName.includes('الهضبة') || lowerName.includes('hadaba')) return 'رؤية العقارية (Rooya Group)';
  if (lowerName.includes('العلمين') || lowerName.includes('alamein')) return 'هيئة المجتمعات العمرانية (NUCA)';
  if (lowerName.includes('رملة') || lowerName.includes('ramla') || lowerName.includes('district 5')) return 'مراكز العقارية (Marakez)';
  if (lowerName.includes('أروما') || lowerName.includes('aroma')) return 'Akam';
  if (lowerName.includes('هايد بارك') || lowerName.includes('hyde park')) return 'شركة هايد بارك العقارية';
  if (lowerName.includes('درة الكرز') || lowerName.includes('durrat al karaz')) return 'شركة درة الكرز للاستثمار';
  if (lowerName.includes('جراند لايف') || lowerName.includes('granda life')) return 'إيجي جاب (EGYGAB)';
  if (lowerName.includes('المسار') || lowerName.includes('al masar')) return 'جينيت (Genet)';
  
  return 'غير محدد';
}
