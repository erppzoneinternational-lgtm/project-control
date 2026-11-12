'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { resolveBasemap } from '@/lib/map/basemaps';
import { createResilientTileLayer } from '@/lib/map/tileResilience';
import {
  MapPin,
  Compass,
  Copy,
  Check,
  Search,
  X,
  Maximize2,
  Minimize2,
  Crosshair,
  Layers,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import {
  EGYPT_GOVERNORATES_GEO,
  resolveEgyptLocationFromGps,
  normalizeGeoText,
} from '@/lib/geo/egyptGeo';

export interface ProjectLocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  governorateName?: string;
  cityName?: string;
  className?: string;
}

interface SearchItem {
  id: string;
  nameAr: string;
  nameEn: string;
  subTitle: string;
  coords: [number, number];
  zoom: number;
  type: 'city' | 'gov' | 'coord';
}

const REGION_SHORTCUTS = [
  { label: 'القاهرة والجيزة', coords: [30.0444, 31.2357], zoom: 11, icon: '🏛️' },
  { label: 'الساحل والعلمين', coords: [30.85, 28.95], zoom: 10, icon: '🌊' },
  { label: 'العاصمة الإدارية', coords: [30.0168, 31.7303], zoom: 12, icon: '🏙️' },
  { label: 'البحر الأحمر والغردقة', coords: [27.2579, 33.8116], zoom: 11, icon: '☀️' },
  { label: 'الأقصر وأسوان', coords: [25.6872, 32.6396], zoom: 11, icon: '🏺' },
];

function formatCoordDD(lat: number, lng: number) {
  const safeLat = Number(lat) || 0;
  const safeLng = Number(lng) || 0;
  const latDir = safeLat >= 0 ? 'N' : 'S';
  const lngDir = safeLng >= 0 ? 'E' : 'W';
  return {
    latFormatted: `${Math.abs(safeLat).toFixed(4)}° ${latDir}`,
    lngFormatted: `${Math.abs(safeLng).toFixed(4)}° ${lngDir}`,
    combined: `${Math.abs(safeLat).toFixed(4)}° ${latDir}, ${Math.abs(safeLng).toFixed(4)}° ${lngDir}`,
    combinedAr: `${Math.abs(safeLat).toFixed(4)}° ${safeLat >= 0 ? 'شمالاً' : 'جنوباً'}، ${Math.abs(safeLng).toFixed(4)}° ${safeLng >= 0 ? 'شرقاً' : 'غرباً'}`,
    raw: `${safeLat.toFixed(5)}, ${safeLng.toFixed(5)}`,
  };
}

function createPinIcon(L: any) {
  return L.divIcon({
    className: 'pzone-pin-marker',
    html: `
      <div style="position: relative; transform: translate(-50%, -100%); cursor: grab;">
        <div style="
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 6px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 50%;
          filter: blur(1.5px);
        "></div>
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: 2.5px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 11px;
            height: 11px;
            background: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          "></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];
  for (const gov of EGYPT_GOVERNORATES_GEO) {
    items.push({
      id: `gov_${gov.code}`,
      nameAr: gov.name_ar,
      nameEn: gov.name_en,
      subTitle: 'محافظة مصرية',
      coords: gov.coords,
      zoom: gov.zoom || 11,
      type: 'gov',
    });

    for (let i = 0; i < gov.cities.length; i++) {
      const c = gov.cities[i];
      items.push({
        id: `city_${gov.code}_${i}`,
        nameAr: c.name_ar,
        nameEn: c.name_en,
        subTitle: `مدينة / حي • ${gov.name_ar}`,
        coords: c.coords,
        zoom: c.zoom || 13,
        type: 'city',
      });
    }
  }
  return items;
}

// ─────────────────────────────────────────────────────────────
// FULLSCREEN PORTAL MODAL COMPONENT
// ─────────────────────────────────────────────────────────────
interface FullscreenLocationPickerModalProps {
  initialLat: number;
  initialLng: number;
  initialBasemap: 'streets' | 'satellite';
  governorateName?: string;
  cityName?: string;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
}

const FullscreenLocationPickerModal: React.FC<FullscreenLocationPickerModalProps> = ({
  initialLat,
  initialLng,
  initialBasemap,
  governorateName,
  cityName,
  onClose,
  onConfirm,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const [coords, setCoords] = useState<[number, number]>([initialLat, initialLng]);
  const [basemapMode, setBasemapMode] = useState<'streets' | 'satellite'>(initialBasemap);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualError, setManualError] = useState('');

  const searchIndex = useMemo(() => buildSearchIndex(), []);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return [];

    const coordMatch = query.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const pLat = parseFloat(coordMatch[1]);
      const pLng = parseFloat(coordMatch[3]);
      if (!isNaN(pLat) && !isNaN(pLng) && pLat >= -90 && pLat <= 90 && pLng >= -180 && pLng <= 180) {
        return [
          {
            id: 'manual_gps_result',
            nameAr: `إحداثيات GPS: ${pLat.toFixed(4)}, ${pLng.toFixed(4)}`,
            nameEn: `GPS: ${pLat.toFixed(4)}, ${pLng.toFixed(4)}`,
            subTitle: 'انقر للانتقال مباشرة إلى هذه النقطة',
            coords: [pLat, pLng] as [number, number],
            zoom: 14,
            type: 'coord' as const,
          },
        ];
      }
    }

    const normQuery = normalizeGeoText(query);
    return searchIndex
      .filter((item) => {
        const arNorm = normalizeGeoText(item.nameAr);
        const enNorm = item.nameEn.toLowerCase();
        return arNorm.includes(normQuery) || enNorm.includes(query.toLowerCase());
      })
      .slice(0, 8);
  }, [searchQuery, searchIndex]);

  const resolvedGeo = useMemo(() => {
    return resolveEgyptLocationFromGps(coords[0], coords[1]);
  }, [coords]);

  const locationTitle = useMemo(() => {
    if (cityName && governorateName) return `${governorateName} • ${cityName}`;
    if (cityName) return cityName;
    if (governorateName) return governorateName;
    if (resolvedGeo.city && resolvedGeo.governorate) {
      return `${resolvedGeo.governorate.name_ar} • ${resolvedGeo.city.name_ar}`;
    }
    return resolvedGeo.governorate?.name_ar || 'جمهورية مصر العربية';
  }, [cityName, governorateName, resolvedGeo]);

  const updateTileLayer = useCallback(
    async (mode: 'streets' | 'satellite') => {
      if (!mapRef.current) return;
      const L = (await import('leaflet')).default;
      const basemap = resolveBasemap(mode, false);

      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }

      const { layer } = createResilientTileLayer(L, basemap, {
        onFailover: (fallback, count) => {
          console.warn(`[ProjectLocationPickerModal] Failover triggered (${count} errors). Switching to fallback: ${fallback.name}`);
          if (mapRef.current && tileLayerRef.current) {
            mapRef.current.removeLayer(tileLayerRef.current);
            tileLayerRef.current = L.tileLayer(fallback.url, {
              attribution: fallback.attribution,
              maxZoom: fallback.maxZoom,
              maxNativeZoom: fallback.maxNativeZoom,
              keepBuffer: 6,
              ...(fallback.subdomains ? { subdomains: fallback.subdomains } : {}),
            }).addTo(mapRef.current);
          }
        },
      });

      tileLayerRef.current = layer.addTo(mapRef.current);
    },
    []
  );

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Initialize Modal Leaflet Map
  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        if (!isMounted || !containerRef.current) return;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        if ((containerRef.current as any)?._leaflet_id) {
          delete (containerRef.current as any)._leaflet_id;
        }

        const map = L.map(containerRef.current, {
          center: [initialLat, initialLng],
          zoom: 12,
          scrollWheelZoom: true,
          zoomControl: false,
        });
        mapRef.current = map;

        L.control.zoom({ position: 'topright' }).addTo(map);

        const basemap = resolveBasemap(basemapMode, false);
        const { layer } = createResilientTileLayer(L, basemap, {
          onFailover: (fallback, count) => {
            console.warn(`[ProjectLocationPickerModal] Failover triggered (${count} errors). Switching to fallback: ${fallback.name}`);
            if (mapRef.current && tileLayerRef.current) {
              mapRef.current.removeLayer(tileLayerRef.current);
              tileLayerRef.current = L.tileLayer(fallback.url, {
                attribution: fallback.attribution,
                maxZoom: fallback.maxZoom,
                maxNativeZoom: fallback.maxNativeZoom,
                keepBuffer: 6,
                ...(fallback.subdomains ? { subdomains: fallback.subdomains } : {}),
              }).addTo(mapRef.current);
            }
          },
        });
        tileLayerRef.current = layer.addTo(map);

        const pinIcon = createPinIcon(L);

        const marker = L.marker([initialLat, initialLng], {
          icon: pinIcon,
          draggable: true,
          autoPan: true,
          autoPanPadding: [40, 40],
          title: 'اسحب الدبوس أو انقر على الخريطة لتحديد الموقع',
        }).addTo(map);
        markerRef.current = marker;

        marker.on('drag', (e: any) => {
          const pos = e.target.getLatLng();
          setCoords([Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5))]);
        });

        marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          setCoords([Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5))]);
        });

        map.on('click', (e: any) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          const finalLat = Number(clickLat.toFixed(5));
          const finalLng = Number(clickLng.toFixed(5));
          marker.setLatLng([finalLat, finalLng]);
          setCoords([finalLat, finalLng]);
        });

        // Trigger safe size invalidation after modal layout paint
        const safeFsResize = () => {
          if (mapRef.current && (mapRef.current as any)._mapPane) {
            mapRef.current.invalidateSize({ animate: false });
          }
        };
        const t1 = setTimeout(safeFsResize, 50);
        const t2 = setTimeout(safeFsResize, 200);
        const t3 = setTimeout(safeFsResize, 500);
        timersRef.current.push(t1, t2, t3);

        // ResizeObserver to automatically resize map whenever container or window changes
        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            safeFsResize();
          });
          resizeObserver.observe(containerRef.current);
        }
      } catch (err) {
        console.error('Failed to init Fullscreen Map:', err);
      }
    };

    initMap();

    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapRef.current) {
        try {
          mapRef.current.stop();
        } catch {
          // Ignore if already stopped
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleFlyTo = (targetCoords: [number, number], zoom: number) => {
    if (!mapRef.current || !markerRef.current) return;
    const finalLat = Number(targetCoords[0].toFixed(5));
    const finalLng = Number(targetCoords[1].toFixed(5));
    mapRef.current.flyTo(targetCoords, zoom, { duration: 0.8 });
    markerRef.current.setLatLng(targetCoords);
    setCoords([finalLat, finalLng]);
  };

  const toggleBasemap = () => {
    const next = basemapMode === 'streets' ? 'satellite' : 'streets';
    setBasemapMode(next);
    updateTileLayer(next);
  };

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(coords, Math.max(mapRef.current.getZoom(), 13), { duration: 0.6 });
    }
  };

  const handleApplyManual = (e: React.FormEvent) => {
    e.preventDefault();
    const pLat = parseFloat(manualLat);
    const pLng = parseFloat(manualLng);
    if (isNaN(pLat) || isNaN(pLng)) {
      setManualError('يرجى إدخال أرقام صحيحة لخط العرض وخط الطول');
      return;
    }
    if (pLat < -90 || pLat > 90 || pLng < -180 || pLng > 180) {
      setManualError('قيم الإحداثيات خارج النطاق الجغرافي المسموح');
      return;
    }
    setManualError('');
    handleFlyTo([pLat, pLng], 15);
    setShowManualModal(false);
  };

  const formatted = formatCoordDD(coords[0], coords[1]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="تحديد موقع المشروع ملء الشاشة"
      className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md p-2 sm:p-5 flex items-center justify-center animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-6xl h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div ref={searchContainerRef} className="relative flex-1">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ابحث عن محافظة، مدينة، حي، أو الصق إحداثيات GPS (مثال: الشيخ زايد، العلمين، 30.04, 31.23)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setIsSearchOpen(true);
                  }}
                  className="w-full pr-9 pl-8 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute left-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <ul className="absolute top-full mt-1.5 left-0 right-0 z-[1200] max-h-64 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 space-y-1">
                  {searchResults.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => {
                        handleFlyTo(item.coords, item.zoom);
                        setSearchQuery(item.nameAr);
                        setIsSearchOpen(false);
                      }}
                      className="px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-bold truncate">{item.nameAr}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                        {item.subTitle}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top Action Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleBasemap}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>{basemapMode === 'streets' ? 'أقمار صناعية' : 'خريطة شوارع'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shadow-xs"
                title="إغلاق ملء الشاشة (Esc)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Region Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-500" />
              وجهات سريعة:
            </span>
            {REGION_SHORTCUTS.map((reg) => (
              <button
                key={reg.label}
                type="button"
                onClick={() => handleFlyTo(reg.coords as [number, number], reg.zoom)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30 border border-transparent transition-all shrink-0 flex items-center gap-1"
              >
                <span>{reg.icon}</span>
                <span>{reg.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Map Canvas */}
        <div className="relative flex-1 w-full min-h-[380px] overflow-hidden">
          <div ref={containerRef} className="w-full h-full" />

          {/* Floating Bottom HUD */}
          <div className="absolute bottom-3 inset-x-3 sm:inset-x-4 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            {/* Location & GPS Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {locationTitle}
                </div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                  {formatted.combined}
                </div>
              </div>
            </div>

            {/* Quick Action Tools */}
            <div className="flex items-center gap-1.5 shrink-0 ms-auto">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/50 dark:border-blue-800/50 transition-colors flex items-center gap-1.5 font-bold text-xs"
                title="فتح الموقع في صفحة منفصلة بخرائط Google"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Google Maps</span>
              </a>

              <button
                type="button"
                onClick={handleCopyCoords}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="نسخ الإحداثيات"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleRecenter}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="توسيط الخريطة على موقع الدبوس"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setManualLat(String(coords[0]));
                  setManualLng(String(coords[1]));
                  setShowManualModal(true);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="إدخال الإحداثيات يدوياً"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onConfirm(coords[0], coords[1])}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد واستخدام الموقع</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>

        {/* Manual Modal Inside Fullscreen */}
        {showManualModal && (
          <div className="fixed inset-0 z-[10500] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">إدخال إحداثيات GPS يدوياً</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {manualError && (
                <div className="text-xs text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-950/40 p-2 rounded-xl font-medium">
                  {manualError}
                </div>
              )}

              <form onSubmit={handleApplyManual} className="space-y-3">
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      خط العرض (Latitude)
                    </label>
                    <input
                      type="text"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      placeholder="مثال: 30.0444"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      خط الطول (Longitude)
                    </label>
                    <input
                      type="text"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                      placeholder="مثال: 31.2357"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm"
                  >
                    تطبيق الإحداثيات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN INLINE COMPONENT
// ─────────────────────────────────────────────────────────────
export const ProjectLocationPickerMap: React.FC<ProjectLocationPickerMapProps> = ({
  lat,
  lng,
  onChange,
  governorateName,
  cityName,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // States
  const [liveCoords, setLiveCoords] = useState<[number, number]>([
    Number(lat) || 30.0444,
    Number(lng) || 31.2357,
  ]);
  const [copied, setCopied] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [basemapMode, setBasemapMode] = useState<'streets' | 'satellite'>('streets');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualError, setManualError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync internal live coords when props change externally
  useEffect(() => {
    if (lat && lng) {
      setLiveCoords([Number(lat), Number(lng)]);
    }
  }, [lat, lng]);

  const searchIndex = useMemo(() => buildSearchIndex(), []);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return [];

    const coordMatch = query.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const pLat = parseFloat(coordMatch[1]);
      const pLng = parseFloat(coordMatch[3]);
      if (!isNaN(pLat) && !isNaN(pLng) && pLat >= -90 && pLat <= 90 && pLng >= -180 && pLng <= 180) {
        return [
          {
            id: 'manual_gps_result',
            nameAr: `إحداثيات GPS: ${pLat.toFixed(4)}, ${pLng.toFixed(4)}`,
            nameEn: `GPS: ${pLat.toFixed(4)}, ${pLng.toFixed(4)}`,
            subTitle: 'انقر للانتقال مباشرة إلى هذه النقطة',
            coords: [pLat, pLng] as [number, number],
            zoom: 14,
            type: 'coord' as const,
          },
        ];
      }
    }

    const normQuery = normalizeGeoText(query);
    return searchIndex
      .filter((item) => {
        const arNorm = normalizeGeoText(item.nameAr);
        const enNorm = item.nameEn.toLowerCase();
        return arNorm.includes(normQuery) || enNorm.includes(query.toLowerCase());
      })
      .slice(0, 6);
  }, [searchQuery, searchIndex]);

  const resolvedGeo = useMemo(() => {
    return resolveEgyptLocationFromGps(liveCoords[0], liveCoords[1]);
  }, [liveCoords]);

  const activeLocationTitle = useMemo(() => {
    if (cityName && governorateName) return `${governorateName} • ${cityName}`;
    if (cityName) return cityName;
    if (governorateName) return governorateName;
    if (resolvedGeo.city && resolvedGeo.governorate) {
      return `${resolvedGeo.governorate.name_ar} • ${resolvedGeo.city.name_ar}`;
    }
    return resolvedGeo.governorate?.name_ar || 'جمهورية مصر العربية';
  }, [cityName, governorateName, resolvedGeo]);

  const updateTileLayer = useCallback(
    async (mode: 'streets' | 'satellite') => {
      if (!mapRef.current) return;
      const L = (await import('leaflet')).default;
      const basemap = resolveBasemap(mode, false);

      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }

      const { layer } = createResilientTileLayer(L, basemap, {
        onFailover: (fallback, count) => {
          console.warn(`[ProjectLocationPickerMap] Failover triggered (${count} errors). Switching to fallback: ${fallback.name}`);
          if (mapRef.current && tileLayerRef.current) {
            mapRef.current.removeLayer(tileLayerRef.current);
            tileLayerRef.current = L.tileLayer(fallback.url, {
              attribution: fallback.attribution,
              maxZoom: fallback.maxZoom,
              maxNativeZoom: fallback.maxNativeZoom,
              ...(fallback.subdomains ? { subdomains: fallback.subdomains } : {}),
            }).addTo(mapRef.current);
          }
        },
      });

      tileLayerRef.current = layer.addTo(mapRef.current);
    },
    []
  );

  // Initialize Inline Map
  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    let isMounted = true;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        if (!isMounted || !containerRef.current) return;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const initialLat = Number(lat) || 30.0444;
        const initialLng = Number(lng) || 31.2357;

        const map = L.map(containerRef.current, {
          center: [initialLat, initialLng],
          zoom: 11,
          scrollWheelZoom: true,
          zoomControl: false,
        });
        mapRef.current = map;

        L.control.zoom({ position: 'topright' }).addTo(map);

        const basemap = resolveBasemap(basemapMode, false);
        const { layer } = createResilientTileLayer(L, basemap, {
          onFailover: (fallback, count) => {
            console.warn(`[ProjectLocationPickerMap] Failover triggered (${count} errors). Switching to fallback: ${fallback.name}`);
            if (mapRef.current && tileLayerRef.current) {
              mapRef.current.removeLayer(tileLayerRef.current);
              tileLayerRef.current = L.tileLayer(fallback.url, {
                attribution: fallback.attribution,
                maxZoom: fallback.maxZoom,
                maxNativeZoom: fallback.maxNativeZoom,
                ...(fallback.subdomains ? { subdomains: fallback.subdomains } : {}),
              }).addTo(mapRef.current);
            }
          },
        });
        tileLayerRef.current = layer.addTo(map);

        const pinIcon = createPinIcon(L);

        const marker = L.marker([initialLat, initialLng], {
          icon: pinIcon,
          draggable: true,
          autoPan: true,
          autoPanPadding: [40, 40],
          title: 'اسحب الدبوس أو انقر على الخريطة لتحديد الموقع',
        }).addTo(map);
        markerRef.current = marker;

        marker.on('drag', (e: any) => {
          const position = e.target.getLatLng();
          setLiveCoords([Number(position.lat.toFixed(5)), Number(position.lng.toFixed(5))]);
        });

        marker.on('dragend', (e: any) => {
          const position = e.target.getLatLng();
          const finalLat = Number(position.lat.toFixed(5));
          const finalLng = Number(position.lng.toFixed(5));
          setLiveCoords([finalLat, finalLng]);
          onChange(finalLat, finalLng);
        });

        map.on('click', (e: any) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          const finalLat = Number(clickLat.toFixed(5));
          const finalLng = Number(clickLng.toFixed(5));
          marker.setLatLng([finalLat, finalLng]);
          setLiveCoords([finalLat, finalLng]);
          onChange(finalLat, finalLng);
        });

        setIsLoaded(true);

        const safeInlineResize = () => {
          if (mapRef.current && (mapRef.current as any)._mapPane) {
            mapRef.current.invalidateSize({ animate: false });
          }
        };
        initTimer = setTimeout(safeInlineResize, 150);

        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            safeInlineResize();
          });
          resizeObserver.observe(containerRef.current);
        }
      } catch (err) {
        console.error('Failed to initialize Leaflet Map:', err);
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    let initTimer: ReturnType<typeof setTimeout> | null = null;
    initMap();

    return () => {
      isMounted = false;
      if (initTimer) {
        clearTimeout(initTimer);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapRef.current) {
        try {
          mapRef.current.stop();
        } catch {
          // Ignore if already stopped
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position and sync camera when external lat/lng change
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    const currentMarkerPos = markerRef.current.getLatLng();
    const targetLat = Number(lat) || 30.0444;
    const targetLng = Number(lng) || 31.2357;

    if (
      Math.abs(currentMarkerPos.lat - targetLat) > 0.0001 ||
      Math.abs(currentMarkerPos.lng - targetLng) > 0.0001
    ) {
      markerRef.current.setLatLng([targetLat, targetLng]);
      setLiveCoords([targetLat, targetLng]);
      mapRef.current.flyTo([targetLat, targetLng], Math.max(mapRef.current.getZoom(), 12), {
        duration: 0.8,
      });
    }
  }, [lat, lng]);

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(liveCoords, Math.max(mapRef.current.getZoom(), 13), {
        duration: 0.8,
      });
    }
  };

  const handleFlyTo = (coords: [number, number], zoom: number) => {
    if (!mapRef.current || !markerRef.current) return;
    const finalLat = Number(coords[0].toFixed(5));
    const finalLng = Number(coords[1].toFixed(5));
    mapRef.current.flyTo(coords, zoom, { duration: 1.0 });
    markerRef.current.setLatLng(coords);
    setLiveCoords([finalLat, finalLng]);
    onChange(finalLat, finalLng);
  };

  const toggleBasemap = () => {
    const nextMode = basemapMode === 'streets' ? 'satellite' : 'streets';
    setBasemapMode(nextMode);
    updateTileLayer(nextMode);
  };

  const handleSelectLocation = (item: SearchItem) => {
    handleFlyTo(item.coords, item.zoom);
    setSearchQuery(item.nameAr);
    setIsSearchOpen(false);
  };

  const handleCopyCoords = () => {
    const text = `${liveCoords[0].toFixed(5)}, ${liveCoords[1].toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyManualCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const pLat = parseFloat(manualLat);
    const pLng = parseFloat(manualLng);

    if (isNaN(pLat) || isNaN(pLng)) {
      setManualError('يرجى إدخال أرقام صحيحة لخط العرض وخط الطول');
      return;
    }
    if (pLat < -90 || pLat > 90) {
      setManualError('خط العرض يجب أن يكون بين -90 و 90 درجة');
      return;
    }
    if (pLng < -180 || pLng > 180) {
      setManualError('خط الطول يجب أن يكون بين -180 و 180 درجة');
      return;
    }

    setManualError('');
    handleFlyTo([pLat, pLng], 15);
    setShowManualModal(false);
  };

  const handleConfirmFromModal = (newLat: number, newLng: number) => {
    setLiveCoords([newLat, newLng]);
    onChange(newLat, newLng);
    setIsModalOpen(false);
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        mapRef.current.flyTo([newLat, newLng], Math.max(mapRef.current.getZoom(), 12), {
          duration: 0.5,
        });
      }
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      }
    }, 100);
  };

  const coordsFormatted = formatCoordDD(liveCoords[0], liveCoords[1]);

  return (
    <>
      <div className={`relative w-full ${className}`}>
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col space-y-0">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Search Autocomplete Input */}
              <div ref={searchContainerRef} className="relative flex-1">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="ابحث عن مدينة، حي، أو الصق إحداثيات GPS (مثال: الشيخ زايد، العلمين، 30.04, 31.23)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => {
                      if (searchQuery.trim()) setIsSearchOpen(true);
                    }}
                    className="w-full pr-9 pl-8 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute left-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {isSearchOpen && searchResults.length > 0 && (
                  <ul className="absolute top-full mt-1.5 left-0 right-0 z-[1200] max-h-60 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 space-y-1">
                    {searchResults.map((item) => (
                      <li
                        key={item.id}
                        onClick={() => handleSelectLocation(item)}
                        className="px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-bold truncate">{item.nameAr}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                          {item.subTitle}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action Buttons (Layers + Fullscreen) */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={toggleBasemap}
                  className="px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 shadow-xs"
                  title="التبديل بين خريطة الشوارع والأقمار الصناعية"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{basemapMode === 'streets' ? 'أقمار صناعية' : 'خريطة شوارع'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-xs"
                  title="تكبير الخريطة ملء الشاشة"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Region Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-emerald-500" />
                وجهات سريعة:
              </span>
              {REGION_SHORTCUTS.map((reg) => (
                <button
                  key={reg.label}
                  type="button"
                  onClick={() => handleFlyTo(reg.coords as [number, number], reg.zoom)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30 border border-transparent transition-all shrink-0 flex items-center gap-1"
                >
                  <span>{reg.icon}</span>
                  <span>{reg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Inline Map Canvas */}
          <div className="relative w-full h-[340px] sm:h-[400px] overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />

            {/* Floating Bottom HUD */}
            <div className="absolute bottom-3 inset-x-3 sm:inset-x-4 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-lg flex items-center justify-between gap-3">
              {/* Location & GPS Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {activeLocationTitle}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                    {coordsFormatted.combined}
                  </div>
                </div>
              </div>

              {/* Quick Action Tools */}
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${liveCoords[0]},${liveCoords[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/50 dark:border-blue-800/50 transition-colors flex items-center gap-1.5 font-bold text-xs"
                  title="فتح الموقع في صفحة منفصلة بخرائط Google"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Google Maps</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyCoords}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  title="نسخ الإحداثيات"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleRecenter}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  title="توسيط الخريطة على موقع الدبوس"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setManualLat(String(liveCoords[0]));
                    setManualLng(String(liveCoords[1]));
                    setShowManualModal(true);
                  }}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  title="إدخال الإحداثيات يدوياً"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="تكبير الخريطة ملء الشاشة لتحديد الموقع بدقة"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تكبير ملء الشاشة</span>
                </button>
              </div>
            </div>
          </div>

          {/* Manual Dialog */}
          {showManualModal && (
            <div className="fixed inset-0 z-[10500] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">إدخال إحداثيات GPS يدوياً</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {manualError && (
                  <div className="text-xs text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-950/40 p-2 rounded-xl font-medium">
                    {manualError}
                  </div>
                )}

                <form onSubmit={handleApplyManualCoords} className="space-y-3">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        خط العرض (Latitude)
                      </label>
                      <input
                        type="text"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        placeholder="مثال: 30.0444"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        خط الطول (Longitude)
                      </label>
                      <input
                        type="text"
                        value={manualLng}
                        onChange={(e) => setManualLng(e.target.value)}
                        placeholder="مثال: 31.2357"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowManualModal(false)}
                      className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm"
                    >
                      تطبيق الإحداثيات
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render Fullscreen Modal in document.body Portal */}
      {isModalOpen && mounted && typeof document !== 'undefined' &&
        createPortal(
          <FullscreenLocationPickerModal
            initialLat={liveCoords[0]}
            initialLng={liveCoords[1]}
            initialBasemap={basemapMode}
            governorateName={governorateName}
            cityName={cityName}
            onClose={() => {
              setIsModalOpen(false);
              setTimeout(() => {
                mapRef.current?.invalidateSize();
              }, 100);
            }}
            onConfirm={handleConfirmFromModal}
          />,
          document.body
        )
      }
    </>
  );
};
