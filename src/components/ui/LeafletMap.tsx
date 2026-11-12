'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { resolveBasemap } from '@/lib/map/basemaps';
import { createResilientTileLayer } from '@/lib/map/tileResilience';

interface LeafletMapProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  interactive?: boolean;
  title?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  lat = 30.0444,
  lng = 31.2357,
  zoom = 12,
  onLocationSelect,
  interactive = false,
  title = 'موقع المشروع',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
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
        setTimeout(() => {
          if (mapRef.current && (mapRef.current as any)._mapPane) {
            mapRef.current.invalidateSize({ animate: false });
          }
        }, 100);
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

      const customIcon = L.divIcon({
        className: 'custom-pzone-marker',
        html: `
          <div style="position: relative; width: 32px; height: 42px; display: flex; align-items: flex-start; justify-content: center; filter: drop-shadow(0 4px 10px rgba(16, 185, 129, 0.45));">
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16C0 27.2 14.4 40.8 15.016 41.372C15.573 41.89 16.427 41.89 16.984 41.372C17.6 40.8 32 27.2 32 16C32 7.163 24.837 0 16 0Z" fill="#059669"/>
              <circle cx="16" cy="15" r="6" fill="#ffffff"/>
            </svg>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -38],
      });

      const map = L.map(containerRef.current).setView([lat, lng], zoom);
      mapRef.current = map;

      const isDark = document.documentElement.classList.contains('dark');
      const basemap = resolveBasemap('auto', isDark);
      const { layer } = createResilientTileLayer(L, basemap);
      layer.addTo(map);

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      const safeTitle = String(title)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      marker.bindPopup(`
        <div style="direction: rtl; text-align: start; font-family: inherit; min-width: 140px;">
          <b style="font-size: 12px; color: #0f172a;">${safeTitle}</b>
          <div style="margin-top: 6px;">
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 4px 8px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: bold;">
              فتح في خرائط Google ↗
            </a>
          </div>
        </div>
      `).openPopup();

      if (interactive && onLocationSelect) {
        map.on('click', (e: any) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          marker.setLatLng([clickLat, clickLng]);
          onLocationSelect(clickLat, clickLng);
        });
      }
    };

    initMap();

    return () => {
      isMounted = false;
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
  }, [lat, lng, zoom, interactive, onLocationSelect, title]);

  return (
    <div
      className={`relative overflow-hidden transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen bg-slate-950 rounded-none border-0'
          : 'w-full h-full min-h-[300px] rounded-xl z-0 border border-slate-700/50'
      }`}
    >
      <div ref={containerRef} className="w-full h-full min-h-[300px]" />

      {/* Floating Fullscreen Toggle Button */}
      <button
        type="button"
        onClick={toggleFullscreen}
        title={
          isFullscreen
            ? isAr
              ? 'إنهاء ملء الشاشة (Esc)'
              : 'Exit fullscreen (Esc)'
            : isAr
            ? 'عرض الخريطة ملء الشاشة'
            : 'View map in fullscreen'
        }
        aria-label={isAr ? 'تبديل ملء الشاشة' : 'Toggle fullscreen'}
        className="absolute top-3 end-3 z-[1000] p-2 sm:px-3 sm:py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-500" /> : <Maximize2 className="w-4 h-4" />}
        <span className="hidden sm:inline">
          {isFullscreen
            ? isAr
              ? 'إنهاء ملء الشاشة'
              : 'Exit Fullscreen'
            : isAr
            ? 'ملء الشاشة'
            : 'Fullscreen'}
        </span>
      </button>

      {/* Title badge in fullscreen */}
      {isFullscreen && (
        <div className="absolute top-3 start-3 z-[1000] px-3.5 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white text-xs font-bold shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-md">
          {title}
        </div>
      )}

      {/* Google Maps link */}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 start-3 z-[1000] px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 text-blue-600 dark:text-blue-400 text-xs font-bold shadow-lg border border-slate-200 dark:border-slate-800 backdrop-blur-md flex items-center gap-1.5 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all"
        title="فتح الموقع في صفحة منفصلة بخرائط Google"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        <span>Google Maps</span>
      </a>
    </div>
  );
};
