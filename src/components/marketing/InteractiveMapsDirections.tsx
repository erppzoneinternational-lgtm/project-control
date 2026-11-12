'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Building2, PhoneCall, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface PzoneHubLocation {
  id: string;
  nameAr: string;
  nameEn: string;
  typeAr: string;
  typeEn: string;
  addressAr: string;
  addressEn: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const pzoneHubLocations: PzoneHubLocation[] = [
  {
    id: 'hq-new-cairo',
    nameAr: 'المقر الرئيسي — القاهرة الجديدة (New Cairo HQ)',
    nameEn: 'Pzone Head Office — New Cairo HQ',
    typeAr: 'المقر الرئيسي والمكتب الفني الهندسي',
    typeEn: 'Headquarters & Technical Engineering Office',
    addressAr: 'التجمع الخامس، بالقرب من التسعين الجنوبي، القاهرة الجديدة',
    addressEn: 'Fifth Settlement, Near South 90th St, New Cairo, Egypt',
    lat: 30.0289,
    lng: 31.4913,
    zoom: 14,
  },
  {
    id: 'north-coast-hub',
    nameAr: 'مركز إدارة مشروعات الساحل الشمالي ومطروح',
    nameEn: 'North Coast & Matrouh Regional Hub',
    typeAr: 'مكتب إدارة مشروعات البحيرات وحمامات السباحة',
    typeEn: 'Regional Water Scope Construction Office',
    addressAr: 'الكيلو 126 طريق الإسكندرية – مطروح، بالقرب من مراسي وفوكا باي',
    addressEn: 'Km 126 Alex-Matrouh Road, Near Marassi & Fouka Bay',
    lat: 30.9324,
    lng: 28.9892,
    zoom: 12,
  },
  {
    id: 'red-sea-hub',
    nameAr: 'مركز مشروعات البحر الأحمر (الجونة والغردقة)',
    nameEn: 'Red Sea Regional Hub (El Gouna & Hurghada)',
    typeAr: 'مكتب تنفيذ النوافير والمنتجعات المائية',
    typeEn: 'Resort Water Features & Lagoon Office',
    addressAr: 'الجونة، مدخل مرحلة الفنادق والبحيرات، الغردقة، البحر الأحمر',
    addressEn: 'El Gouna Resort Entrance, Hurghada, Red Sea Governorate',
    lat: 27.3949,
    lng: 33.6775,
    zoom: 12,
  },
  {
    id: 'october-zayed-hub',
    nameAr: 'مركز مشروعات الشيخ زايد و6 أكتوبر',
    nameEn: 'Sheikh Zayed & 6th October Hub',
    typeAr: 'مكتب إدارة مشروعات غرب القاهرة',
    typeEn: 'West Cairo Projects & Field Operations',
    addressAr: 'طريق وصلة دهشور، الشيخ زايد، بالقرب من كمبوند سوديك ويست',
    addressEn: 'Dahshour Link Road, Sheikh Zayed, Near SODIC West',
    lat: 29.9723,
    lng: 30.9458,
    zoom: 13,
  },
  {
    id: 'new-capital-hub',
    nameAr: 'مركز مشروعات العاصمة الإدارية الجديدة',
    nameEn: 'New Administrative Capital Hub',
    typeAr: 'مكتب متابعة المنشآت المائية الحكومية والسكنية',
    typeEn: 'Governmental & Residential Water Scope Office',
    addressAr: 'الحي السكني R7، بالقرب من كمبوند فينشي، العاصمة الإدارية',
    addressEn: 'R7 District, Near Vinci Compound, New Administrative Capital',
    lat: 30.0168,
    lng: 31.7303,
    zoom: 13,
  },
];

export interface InteractiveMapsDirectionsProps {
  locations?: PzoneHubLocation[];
  className?: string;
}

export const InteractiveMapsDirections: React.FC<InteractiveMapsDirectionsProps> = ({
  locations = pzoneHubLocations,
  className = '',
}) => {
  const { t, locale } = useLanguage();
  const isAr = locale === 'ar';

  const [selectedHub, setSelectedHub] = useState<PzoneHubLocation>(locations[0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => mapRef.current?.invalidateSize(), 50);
      setTimeout(() => mapRef.current?.invalidateSize(), 200);
      setTimeout(() => mapRef.current?.invalidateSize(), 500);
      return next;
    });
  }, []);

  // Keyboard shortcut: Esc to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
        setTimeout(() => mapRef.current?.invalidateSize(), 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Lock body scroll during fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      if (!isMounted || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current).setView(
        [selectedHub.lat, selectedHub.lng],
        selectedHub.zoom
      );
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Render markers for all hubs
      locations.forEach((hub) => {
        const isSelected = hub.id === selectedHub.id;
        const iconUrl = isSelected
          ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-cyan.png'
          : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';

        const customIcon = L.icon({
          iconUrl,
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });

        const name = isAr ? hub.nameAr : hub.nameEn;
        const type = isAr ? hub.typeAr : hub.typeEn;

        const marker = L.marker([hub.lat, hub.lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: inherit; direction: ${isAr ? 'rtl' : 'ltr'}; text-align: ${isAr ? 'right' : 'left'};">
            <strong style="color: #0f172a; font-size: 13px;">${name}</strong><br/>
            <span style="color: #64748b; font-size: 11px;">${type}</span>
          </div>
        `);

        if (isSelected) {
          marker.openPopup();
        }

        marker.on('click', () => {
          setSelectedHub(hub);
        });
      });
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [selectedHub, locations, isAr]);

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedHub.lat},${selectedHub.lng}`;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
          <Building2 className="h-3.5 w-3.5" />
          <span>Pzone Regional Presence</span>
        </div>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {t('r3.interactive_map.title')}
        </h2>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          {t('r3.interactive_map.subtitle')}
        </p>
      </div>

      {/* Main Grid: Hub Selector Cards (Sidebar) + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Sidebar Hub List */}
        <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            {t('r3.interactive_map.select_hub')}
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pe-1 scrollbar-thin">
            {locations.map((hub) => {
              const isSelected = hub.id === selectedHub.id;
              const name = isAr ? hub.nameAr : hub.nameEn;
              const type = isAr ? hub.typeAr : hub.typeEn;
              const address = isAr ? hub.addressAr : hub.addressEn;

              return (
                <button
                  key={hub.id}
                  onClick={() => setSelectedHub(hub)}
                  className={`w-full text-start p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <h4 className="text-sm font-bold text-white leading-tight truncate">
                        {name}
                      </h4>
                      <p className="text-xs text-emerald-400 font-medium">{type}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{address}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Hub Action Bar */}
          <div className="pt-2">
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-700 hover:from-cyan-500 hover:to-emerald-500 py-3.5 px-5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01]"
            >
              <Navigation className="h-4 w-4" />
              <span>{t('r3.interactive_map.directions_btn')}</span>
              <ExternalLink className="h-3.5 w-3.5 text-cyan-200" />
            </a>
          </div>
        </div>

        {/* Leaflet GIS Map Container */}
        <div className={`relative transition-all duration-200 overflow-hidden shadow-2xl ${
          isFullscreen
            ? 'fixed inset-0 z-[99999] w-screen h-screen bg-slate-950 rounded-none border-0'
            : 'lg:col-span-7 h-[360px] lg:h-[480px] rounded-3xl border border-slate-800 bg-slate-900'
        }`}>
          <div ref={containerRef} className="w-full h-full min-h-[360px] z-0" />

          {/* Floating Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? (isAr ? 'إنهاء ملء الشاشة (Esc)' : 'Exit Fullscreen') : (isAr ? 'عرض الخريطة ملء الشاشة' : 'Fullscreen Map')}
            aria-label="Toggle Fullscreen"
            className="absolute top-3 end-3 z-[1000] p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-emerald-400 shadow-xl border border-slate-800 backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? (isAr ? 'إنهاء ملء الشاشة' : 'Exit') : (isAr ? 'ملء الشاشة' : 'Fullscreen')}</span>
          </button>

          {/* Active Hub Title in Fullscreen */}
          {isFullscreen && (
            <div className="absolute top-3 start-3 z-[1000] px-4 py-2 rounded-xl bg-slate-900/90 text-white text-xs font-bold shadow-xl border border-slate-800 backdrop-blur-md flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? selectedHub.nameAr : selectedHub.nameEn}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveMapsDirections;
