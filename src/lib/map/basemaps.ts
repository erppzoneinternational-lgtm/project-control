/**
 * Single source of truth for map basemap tiles.
 *
 * Why: CARTO basemaps now require an API key. Keyless CARTO URLs return
 * tiles painted with "API KEY REQUIRED". Every map must resolve tiles here;
 * a regression test forbids `cartocdn.com` anywhere else in src/.
 *
 * Keyless defaults:
 *   streets   -> OpenStreetMap standard tiles
 *   dark      -> Esri World Dark Gray Canvas
 *   satellite -> Esri World Imagery
 * CARTO (Voyager / Dark Matter) is used only when NEXT_PUBLIC_CARTO_API_KEY is set.
 */

export type BasemapMode = 'auto' | 'streets' | 'dark' | 'satellite';
export type BasemapId = 'streets' | 'dark' | 'satellite';

export interface TileLayerFallback {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  maxNativeZoom: number;
  subdomains?: string;
}

export interface Basemap {
  id: BasemapId;
  url: string;
  attribution: string;
  maxZoom: number;
  /** Highest zoom the provider actually serves; Leaflet upscales beyond it. */
  maxNativeZoom: number;
  subdomains?: string;
  /** Optional transparent reference label layer (cities, roads, boundaries) rendered above base tiles. */
  labelOverlayUrl?: string;
  labelOverlayMaxNativeZoom?: number;
  fallbacks: TileLayerFallback[];
}

const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const CARTO_ATTR = `${OSM_ATTR} &copy; <a href="https://carto.com/attributions">CARTO</a>`;
const ESRI_IMAGERY_ATTR = 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';
const ESRI_GRAY_ATTR = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors';
const ESRI_STREET_ATTR = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ';

const ESRI_DARK_LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';
const ESRI_SATELLITE_LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

export function getOsmFallback(): TileLayerFallback {
  return {
    id: 'osm-standard',
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: OSM_ATTR,
    maxZoom: 19,
    maxNativeZoom: 19,
  };
}

export function getEsriStreetFallback(): TileLayerFallback {
  return {
    id: 'esri-street',
    name: 'Esri World Street Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: ESRI_STREET_ATTR,
    maxZoom: 19,
    maxNativeZoom: 18,
  };
}

export function getCartoPositronFallback(cartoKey?: string): TileLayerFallback {
  const key = cartoKey?.trim();
  const url = key
    ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(key)}`
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return {
    id: 'carto-positron',
    name: 'CartoDB Positron',
    url,
    attribution: CARTO_ATTR,
    maxZoom: 19,
    maxNativeZoom: 19,
    subdomains: 'abcd',
  };
}

export function formatTileUrl(
  template: string,
  coords: { x: number; y: number; z: number },
  subdomains?: string,
): string {
  const s =
    subdomains && subdomains.length > 0
      ? subdomains[Math.abs(coords.x + coords.y) % subdomains.length]
      : 'a';
  const r =
    typeof window !== 'undefined' && window.devicePixelRatio > 1 ? '@2x' : '';
  return template
    .replace('{s}', s)
    .replace('{x}', String(coords.x))
    .replace('{y}', String(coords.y))
    .replace('{z}', String(coords.z))
    .replace('{r}', r);
}

export function resolveBasemap(
  mode: BasemapMode,
  isDarkMode: boolean,
  cartoKey?: string,
): Basemap {
  const id: BasemapId = mode === 'auto' ? (isDarkMode ? 'dark' : 'streets') : mode;
  const key = cartoKey?.trim();
  const osmFallback = getOsmFallback();
  const esriStreetFallback = getEsriStreetFallback();
  const standardFallbacks: TileLayerFallback[] = key
    ? [osmFallback, getCartoPositronFallback(key), esriStreetFallback]
    : [osmFallback, esriStreetFallback];

  if (id === 'satellite') {
    return {
      id,
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: ESRI_IMAGERY_ATTR,
      maxZoom: 19,
      maxNativeZoom: 18,
      labelOverlayUrl: ESRI_SATELLITE_LABELS_URL,
      labelOverlayMaxNativeZoom: 18,
      fallbacks: standardFallbacks,
    };
  }

  if (key) {
    const style = id === 'dark' ? 'dark_all' : 'rastertiles/voyager';
    return {
      id,
      url: `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(key)}`,
      attribution: CARTO_ATTR,
      maxZoom: 19,
      maxNativeZoom: 19,
      subdomains: 'abcd',
      fallbacks: standardFallbacks,
    };
  }

  if (id === 'dark') {
    return {
      id,
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: ESRI_GRAY_ATTR,
      maxZoom: 19,
      maxNativeZoom: 16,
      labelOverlayUrl: ESRI_DARK_LABELS_URL,
      labelOverlayMaxNativeZoom: 16,
      fallbacks: standardFallbacks,
    };
  }

  return {
    id,
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: OSM_ATTR,
    maxZoom: 19,
    maxNativeZoom: 19,
    fallbacks: [esriStreetFallback, osmFallback],
  };
}
