import { EGYPT_GOVERNORATES_GEO, calculateDistanceKm, resolveEgyptLocationFromGps } from './egyptGeo';

console.log('=== EGYPT GEO COMPREHENSIVE AUDIT ===\n');

let totalCities = 0;
const errors: string[] = [];
const warnings: string[] = [];

// Egypt geographic boundary envelope: Lat 21.9N to 31.8N, Lng 24.9E to 37.0E
const EGYPT_BOUNDS = { minLat: 21.9, maxLat: 31.8, minLng: 24.9, maxLng: 37.0 };

console.log('1. GOVERNORATES & CITIES OVERVIEW & BOUNDING BOX COMPUTATION:\n');

const govBoundingBoxes: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {};

EGYPT_GOVERNORATES_GEO.forEach((gov, idx) => {
  totalCities += gov.cities.length;
  const [gLat, gLng] = gov.coords;

  // Check governorate center in Egypt
  if (gLat < EGYPT_BOUNDS.minLat || gLat > EGYPT_BOUNDS.maxLat || gLng < EGYPT_BOUNDS.minLng || gLng > EGYPT_BOUNDS.maxLng) {
    errors.push(`Governorate ${gov.name_en} (${gov.code}) coords [${gLat}, ${gLng}] OUTSIDE Egypt!`);
  }

  let minLat = gLat;
  let maxLat = gLat;
  let minLng = gLng;
  let maxLng = gLng;

  let maxCityDist = 0;
  let farthestCity = '';

  gov.cities.forEach((city) => {
    const [cLat, cLng] = city.coords;
    if (cLat < EGYPT_BOUNDS.minLat || cLat > EGYPT_BOUNDS.maxLat || cLng < EGYPT_BOUNDS.minLng || cLng > EGYPT_BOUNDS.maxLng) {
      errors.push(`City ${city.name_en} in ${gov.name_en} coords [${cLat}, ${cLng}] OUTSIDE Egypt!`);
    }

    if (cLat < minLat) minLat = cLat;
    if (cLat > maxLat) maxLat = cLat;
    if (cLng < minLng) minLng = cLng;
    if (cLng > maxLng) maxLng = cLng;

    const dist = calculateDistanceKm(gLat, gLng, cLat, cLng);
    if (dist > maxCityDist) {
      maxCityDist = dist;
      farthestCity = `${city.name_en} (${dist.toFixed(1)} km)`;
    }

    // Check reverse geocoding consistency
    const resolved = resolveEgyptLocationFromGps(cLat, cLng);
    if (resolved.governorate.code !== gov.code) {
      warnings.push(`City "${city.name_en}" (${city.name_ar}) in gov ${gov.name_en} resolves to ${resolved.governorate.name_en} (${resolved.governorate.code}) (dist to resolve: ${resolved.distanceKm.toFixed(1)}km, dist to gov center: ${dist.toFixed(1)}km)`);
    }
  });

  govBoundingBoxes[gov.code] = { minLat, maxLat, minLng, maxLng };

  console.log(`${idx + 1}. [${gov.code}] ${gov.name_ar} / ${gov.name_en}`);
  console.log(`   Center: [${gLat.toFixed(4)}, ${gLng.toFixed(4)}] | Zoom: ${gov.zoom} | Cities: ${gov.cities.length}`);
  console.log(`   Bounding Box: Lat [${minLat.toFixed(4)} .. ${maxLat.toFixed(4)}], Lng [${minLng.toFixed(4)} .. ${maxLng.toFixed(4)}]`);
  console.log(`   Farthest City from center: ${farthestCity || 'None'}`);
  console.log('');
});

console.log('--------------------------------------------------');
console.log(`Total Governorates: ${EGYPT_GOVERNORATES_GEO.length}`);
console.log(`Total Cities: ${totalCities}`);
console.log('--------------------------------------------------\n');

console.log('2. CROSS-REFERENCE / REVERSE GEOCODING WARNINGS:');
if (warnings.length === 0) {
  console.log('No warnings found!');
} else {
  console.log(`Found ${warnings.length} warnings:`);
  warnings.forEach(w => console.log('  ⚠️ ' + w));
}
console.log('');

console.log('3. CRITICAL ERRORS:');
if (errors.length === 0) {
  console.log('No critical coordinate errors found!');
} else {
  console.log(`Found ${errors.length} critical errors:`);
  errors.forEach(e => console.log('  ❌ ' + e));
}
