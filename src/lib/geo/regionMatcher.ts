import { Project } from '@/types';
import { findGovGeo, findCityGeo, isSameGeoLocation, normalizeGeoText } from './egyptGeo';

export type MacroRegionId = 'all' | 'coast' | 'cairo' | 'gouna' | 'upper';

export interface MacroRegionMeta {
  id: MacroRegionId;
  labelAr: string;
  labelEn: string;
  icon: string;
  targetCoords: [number, number];
  zoom: number;
}

export const MACRO_REGIONS: Record<Exclude<MacroRegionId, 'all'>, MacroRegionMeta> = {
  coast: {
    id: 'coast',
    labelAr: '🏖️ الساحل الشمالي والعلمين',
    labelEn: '🏖️ North Coast & Alamein',
    icon: '🏖️',
    targetCoords: [31.05, 28.50],
    zoom: 9,
  },
  cairo: {
    id: 'cairo',
    labelAr: '🏛️ القاهرة الكبرى والعاصمة',
    labelEn: '🏛️ Greater Cairo & New Capital',
    icon: '🏛️',
    targetCoords: [30.02, 31.45],
    zoom: 10,
  },
  gouna: {
    id: 'gouna',
    labelAr: '🌊 الجونة والبحر الأحمر',
    labelEn: '🌊 El Gouna & Red Sea',
    icon: '🌊',
    targetCoords: [27.34, 33.68],
    zoom: 11,
  },
  upper: {
    id: 'upper',
    labelAr: '🌴 الأقصر والصعيد',
    labelEn: '🌴 Upper Egypt & Luxor',
    icon: '🌴',
    targetCoords: [25.69, 32.64],
    zoom: 11,
  },
};

/**
 * Resolves precise Egyptian GPS coordinates for a project.
 * Order of resolution:
 * 1. Direct project latitude/longitude or gps_lat/gps_lng
 * 2. City + Governorate geo database matching
 * 3. Governorate geo database matching
 * 4. Site address semantic keyword parsing
 * 5. Default fallback to Cairo center [30.0444, 31.2357]
 */
export function resolveProjectCoords(p: Partial<Project>): [number, number] {
  const directLat = (p as any).latitude ?? p.gps_lat ?? p.location_gps_lat;
  const directLng = (p as any).longitude ?? p.gps_lng ?? p.location_gps_lng;

  if (directLat && directLng && Number(directLat) !== 0 && Number(directLng) !== 0) {
    return [Number(directLat), Number(directLng)];
  }

  const govName = p.governorate?.name_ar || p.governorate?.name_en || (p as any).governorate_id;
  const cityName = p.city?.name_ar || p.city?.name_en;

  if (cityName && govName) {
    const cityGeo = findCityGeo(cityName, govName);
    if (cityGeo) return cityGeo.coords;
  }

  if (govName) {
    const govGeo = findGovGeo(govName);
    if (govGeo) return govGeo.coords;
  }

  // Address keyword inference
  const addr = (p.site_location_address || p.location || '').toLowerCase();
  if (addr) {
    if (addr.includes('ساحل') || addr.includes('علمين') || addr.includes('مارينا') || addr.includes('مطروح') || addr.includes('ضبعة') || addr.includes('حكمة')) {
      return [30.83, 29.00];
    }
    if (addr.includes('جونة') || addr.includes('غردقة') || addr.includes('حشيش') || addr.includes('مكادي')) {
      return [27.39, 33.67];
    }
    if (addr.includes('سخنة')) {
      return [29.60, 32.35];
    }
    if (addr.includes('شرم') || addr.includes('دهب') || addr.includes('سيناء')) {
      return [27.91, 34.33];
    }
    if (addr.includes('أقصر') || addr.includes('اقصر')) {
      return [25.68, 32.63];
    }
    if (addr.includes('أسوان') || addr.includes('اسوان')) {
      return [24.08, 32.89];
    }
    if (addr.includes('إسكندرية') || addr.includes('اسكندرية')) {
      return [31.20, 29.91];
    }
  }

  return [30.0444, 31.2357];
}

/**
 * Classifies a project into one of Egypt's 4 major development macro-regions:
 * - 'coast': North Coast, Alamein, Alexandria, Matrouh (lat >= 30.7)
 * - 'cairo': Greater Cairo, Giza, New Capital, Delta (lat >= 29.5 && lat < 30.7)
 * - 'gouna': Red Sea, El Gouna, Hurghada, Ain Sokhna, Sinai (lat >= 26.5 && lat < 29.5 or coastal Red Sea)
 * - 'upper': Upper Egypt, Luxor, Aswan, Qena, Sohag, Asyut (lat < 26.5)
 */
export function getProjectMacroRegion(p: Partial<Project>): Exclude<MacroRegionId, 'all'> {
  const govName = (p.governorate?.name_ar || p.governorate?.name_en || (p as any).governorate_id || '').toLowerCase();
  const addr = (p.site_location_address || p.location || '').toLowerCase();
  const cityName = (p.city?.name_ar || p.city?.name_en || '').toLowerCase();
  const combinedText = `${govName} ${addr} ${cityName}`;

  // 1. Direct Red Sea / Sinai check (even if lat is around 29.6 like Ain Sokhna)
  if (
    govName.includes('بحر أحمر') ||
    govName.includes('بحر احمر') ||
    govName.includes('red sea') ||
    govName.includes('جنوب سيناء') ||
    govName.includes('south sinai') ||
    combinedText.includes('جونة') ||
    combinedText.includes('gouna') ||
    combinedText.includes('غردقة') ||
    combinedText.includes('hurghada') ||
    combinedText.includes('سخنة') ||
    combinedText.includes('sokhna') ||
    combinedText.includes('شرم') ||
    combinedText.includes('sharm') ||
    combinedText.includes('مرسى علم') ||
    combinedText.includes('سهل حشيش') ||
    combinedText.includes('مكادي') ||
    combinedText.includes('سوما باي')
  ) {
    return 'gouna';
  }

  // 2. Direct Coast check
  if (
    govName.includes('مطروح') ||
    govName.includes('matrouh') ||
    govName.includes('إسكندرية') ||
    govName.includes('اسكندرية') ||
    govName.includes('alexandria') ||
    govName.includes('كفر الشيخ') ||
    govName.includes('دمياط') ||
    govName.includes('بورسعيد') ||
    govName.includes('البحيرة') ||
    combinedText.includes('ساحل') ||
    combinedText.includes('coast') ||
    combinedText.includes('علمين') ||
    combinedText.includes('alamein') ||
    combinedText.includes('مارينا') ||
    combinedText.includes('ضبعة') ||
    combinedText.includes('سيدي عبد الرحمن') ||
    combinedText.includes('راس الحكمة') ||
    combinedText.includes('رأس الحكمة') ||
    combinedText.includes('برج العرب')
  ) {
    return 'coast';
  }

  // 3. Direct Upper Egypt check
  if (
    govName.includes('أقصر') ||
    govName.includes('اقصر') ||
    govName.includes('luxor') ||
    govName.includes('أسوان') ||
    govName.includes('اسوان') ||
    govName.includes('aswan') ||
    govName.includes('قنا') ||
    govName.includes('qena') ||
    govName.includes('سوهاج') ||
    govName.includes('sohag') ||
    govName.includes('أسيوط') ||
    govName.includes('اسيوط') ||
    govName.includes('asyut') ||
    govName.includes('منيا') ||
    govName.includes('minya') ||
    govName.includes('بني سويف') ||
    govName.includes('beni suef') ||
    govName.includes('وادي جديد') ||
    combinedText.includes('صعيد') ||
    combinedText.includes('توشكى')
  ) {
    return 'upper';
  }

  // 4. Coordinate-based fallback
  const [lat, lng] = resolveProjectCoords(p);
  if (lat >= 30.7) {
    return 'coast';
  }
  if (lat < 26.5) {
    return 'upper';
  }
  if (lat >= 26.5 && lat < 29.5) {
    // Red Sea corridor vs Nile valley
    if (lng >= 32.8) {
      return 'gouna';
    }
    return 'upper';
  }

  // Default to Greater Cairo & Capital
  return 'cairo';
}

/**
 * Normalizes any region identifier or filter string into a canonical macro-region ID if applicable.
 */
export function getMacroRegionId(regionString: string): MacroRegionId | null {
  if (!regionString) return null;
  const s = regionString.trim().toLowerCase();

  if (s === 'all' || s === 'كل مصر' || s === 'جميع المناطق' || s.includes('جميع المناطق')) {
    return 'all';
  }
  if (s === 'coast' || s.includes('ساحل') || s.includes('علمين') || s.includes('north coast')) {
    return 'coast';
  }
  if (s === 'cairo' || s.includes('قاهرة') || s.includes('عاصمة') || s.includes('greater cairo')) {
    return 'cairo';
  }
  if (s === 'gouna' || s.includes('جونة') || s.includes('بحر أحمر') || s.includes('بحر احمر') || s.includes('red sea')) {
    return 'gouna';
  }
  if (s === 'upper' || s.includes('صعيد') || s.includes('أقصر') || s.includes('اقصر') || s.includes('أسوان') || s.includes('upper egypt')) {
    return 'upper';
  }

  return null;
}

/**
 * Robust filter matcher for dashboard projects.
 * Supports:
 * - Macro-region IDs ('coast', 'cairo', 'gouna', 'upper')
 * - Arabic macro-region labels ('الساحل الشمالي والعلمين', 'القاهرة الكبرى', etc.)
 * - Compound region labels ('الجيزة و 6 أكتوبر', 'العين السخنة')
 * - Specific governorate names ('مطروح', 'الإسكندرية', 'القاهرة', 'أسوان')
 * - City / address keyword matching
 */
export function matchesRegionFilter(project: Project, selectedRegion: string): boolean {
  if (!selectedRegion || selectedRegion === 'all') return true;

  // 1. Check if selectedRegion is an explicit macro-region
  if (selectedRegion === 'coast' || selectedRegion === 'cairo' || selectedRegion === 'gouna' || selectedRegion === 'upper') {
    return getProjectMacroRegion(project) === selectedRegion;
  }

  // 2. Check if selectedRegion matches macro-region alias
  if (selectedRegion.includes('الساحل الشمالي') || selectedRegion.includes('العلمين')) {
    return getProjectMacroRegion(project) === 'coast';
  }
  if (selectedRegion === 'القاهرة الكبرى' || selectedRegion.includes('القاهرة الكبرى والعاصمة')) {
    return getProjectMacroRegion(project) === 'cairo';
  }
  if (selectedRegion.includes('الجونة والبحر الأحمر')) {
    return getProjectMacroRegion(project) === 'gouna';
  }
  if (selectedRegion.includes('الأقصر والصعيد')) {
    return getProjectMacroRegion(project) === 'upper';
  }

  // 3. Sub-region compound aliases
  const addr = (project.site_location_address || project.location || '').toLowerCase();
  const govNameAr = (project.governorate?.name_ar || '').toLowerCase();
  const govNameEn = (project.governorate?.name_en || '').toLowerCase();
  const govId = ((project as any).governorate_id || '').toLowerCase();
  const cityNameAr = (project.city?.name_ar || '').toLowerCase();
  const normFilter = normalizeGeoText(selectedRegion);

  if (selectedRegion === 'العين السخنة' || selectedRegion === 'السخنة') {
    return addr.includes('سخنة') || cityNameAr.includes('سخنة');
  }

  if (selectedRegion === 'الجيزة و 6 أكتوبر') {
    return (
      govNameAr.includes('جيزة') ||
      addr.includes('جيزة') ||
      addr.includes('أكتوبر') ||
      addr.includes('اكتوبر') ||
      addr.includes('زايد') ||
      cityNameAr.includes('أكتوبر') ||
      cityNameAr.includes('زايد')
    );
  }

  // 4. Exact or fuzzy governorate match
  if (govNameAr) {
    if (govNameAr === selectedRegion || govNameAr.includes(selectedRegion) || selectedRegion.includes(govNameAr)) {
      return true;
    }
    if (isSameGeoLocation(govNameAr, selectedRegion)) {
      return true;
    }
    if (normalizeGeoText(govNameAr) === normFilter) {
      return true;
    }
  }

  if (govNameEn && govNameEn.toLowerCase().includes(selectedRegion.toLowerCase())) {
    return true;
  }

  if (govId && govId === selectedRegion) {
    return true;
  }

  // 5. City match
  if (cityNameAr) {
    if (cityNameAr === selectedRegion || cityNameAr.includes(selectedRegion) || selectedRegion.includes(cityNameAr)) {
      return true;
    }
    if (isSameGeoLocation(cityNameAr, selectedRegion)) {
      return true;
    }
  }

  // 6. Address fallback
  if (addr && (addr.includes(selectedRegion.toLowerCase()) || addr.includes(normFilter))) {
    return true;
  }

  return false;
}

/**
 * Resolves a human-readable, grounded Egyptian region name for executive insights.
 * Guarantees never returning generic "غير محدد" when coordinates or location data exists.
 */
export function resolveProjectRegionName(p: Partial<Project>): string {
  // 1. Direct governorate
  if (p.governorate?.name_ar) {
    return p.governorate.name_ar;
  }

  // 2. City
  if (p.city?.name_ar) {
    return p.city.name_ar;
  }

  // 3. Address match to governorate
  const addr = (p.site_location_address || p.location || '').trim();
  if (addr) {
    const govGeo = findGovGeo(addr);
    if (govGeo) return govGeo.name_ar;
  }

  // 4. Macro-region label
  const macro = getProjectMacroRegion(p);
  const meta = MACRO_REGIONS[macro];
  if (meta) {
    return meta.labelAr.replace(/^[^\s]+\s/, '');
  }

  return 'القاهرة الكبرى';
}

