'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Project } from '@/types';
import { 
  Globe, 
  Search, 
  X, 
  ExternalLink, 
  Building2, 
  Droplets, 
  DollarSign, 
  MapPin, 
  User, 
  Layers, 
  Compass, 
  Edit3, 
  Copy, 
  Check,
  Navigation,
  Info,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import * as accessControl from '@/lib/rbac/access-control';
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { resolveBasemap, type Basemap } from '@/lib/map/basemaps';
import { TileHealthMonitor, handleTileErrorWithFallback } from '@/lib/map/tileResilience';
import { findGovGeo, findCityGeo } from '@/lib/geo/egyptGeo';
import { getProjectValueWithVat } from '@/lib/utils/projectValue';
import { resolveProjectCoords, getProjectMacroRegion, getMacroRegionId, matchesRegionFilter } from '@/lib/geo/regionMatcher';

interface LocationAnalyticsMapProps {
  projects: Project[];
  allProjects?: Project[];
  selectedRegion?: string;
  selectedStatus?: string;
  onRegionClick?: (regionName: string) => void;
  onStatusClick?: (status: string) => void;
  lang?: 'ar' | 'en';
}

const STATUS_CONFIG: Record<string, { fill: string; label: string; labelEn: string; bgClass: string; textClass: string }> = {
  working: { fill: '#06B6D4', label: 'قيد التنفيذ', labelEn: 'In Progress', bgClass: 'bg-cyan-500/15', textClass: 'text-cyan-600 dark:text-cyan-400 border-cyan-500/30' },
  finished: { fill: '#10B981', label: 'منتهي', labelEn: 'Completed', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  handing_over: { fill: '#6366F1', label: 'تسليم ابتدائي', labelEn: 'Initial Handover', bgClass: 'bg-indigo-500/15', textClass: 'text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
  on_hold: { fill: '#F59E0B', label: 'متوقف', labelEn: 'On Hold', bgClass: 'bg-amber-500/15', textClass: 'text-amber-600 dark:text-amber-400 border-amber-500/30' },
  cancelled: { fill: '#F43F5E', label: 'ملغي', labelEn: 'Cancelled', bgClass: 'bg-rose-500/15', textClass: 'text-rose-600 dark:text-rose-400 border-rose-500/30' },
};

function isLeafletMapAlive(map: unknown): boolean {
  const m = map as { _loaded?: boolean; _mapPane?: HTMLElement; getContainer?: () => HTMLElement | null } | null;
  return Boolean(m && m._loaded && m._mapPane && m.getContainer?.()?.isConnected);
}

// MapController manages map canvas invalidation and programmatic smooth panning
function MapController({ 
  targetCoords, 
  zoomLevel,
  isFullscreen,
}: { 
  targetCoords: [number, number] | null; 
  zoomLevel: number | null; 
  isFullscreen?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    return () => {
      try {
        map.stop();
      } catch {
        // Ignore if map already torn down
      }
    };
  }, [map]);

  useEffect(() => {
    const safeResize = () => {
      if (isLeafletMapAlive(map)) {
        map.invalidateSize({ animate: false });
      }
    };
    safeResize();
    const t1 = setTimeout(safeResize, 50);
    const t2 = setTimeout(safeResize, 200);
    const t3 = setTimeout(safeResize, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map, isFullscreen]);

  useEffect(() => {
    if (targetCoords && zoomLevel && isLeafletMapAlive(map)) {
      map.stop();
      map.flyTo(targetCoords, zoomLevel, { duration: 1.0 });
    }
  }, [targetCoords, zoomLevel, map]);

  return null;
}

// MapFloatingControls provides on-canvas zooming, basemap switcher, recenter, and legend toggle
function MapFloatingControls({
  isRtl,
  basemapMode,
  setBasemapMode,
  showLegend,
  setShowLegend,
  onRecenter,
  isFullscreen,
  onToggleFullscreen,
}: {
  isRtl: boolean;
  basemapMode: 'auto' | 'dark' | 'streets' | 'satellite';
  setBasemapMode: React.Dispatch<React.SetStateAction<'auto' | 'dark' | 'streets' | 'satellite'>>;
  showLegend: boolean;
  setShowLegend: React.Dispatch<React.SetStateAction<boolean>>;
  onRecenter: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const map = useMap();

  const basemapTitles: Record<string, string> = {
    auto: isRtl ? 'النمط التلقائي (حسب الثيم)' : 'Auto Theme Mode',
    dark: isRtl ? 'النمط الداكن' : 'Dark Mode',
    streets: isRtl ? 'نمط الشوارع' : 'Streets Mode',
    satellite: isRtl ? 'الأقمار الصناعية (Satellite)' : 'Satellite Imagery',
  };

  const cycleBasemap = () => {
    const sequence: Array<'auto' | 'dark' | 'streets' | 'satellite'> = ['auto', 'dark', 'streets', 'satellite'];
    const nextIdx = (sequence.indexOf(basemapMode) + 1) % sequence.length;
    setBasemapMode(sequence[nextIdx]);
  };

  return (
    <div 
      className={`absolute top-3 ${isRtl ? 'start-3' : 'start-3'} z-[800] pointer-events-auto flex flex-col gap-1.5`}
    >
      <div 
        className="flex flex-col bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-xl backdrop-blur-md"
        role="toolbar"
        aria-label={isRtl ? 'أدوات التحكم بالخريطة' : 'Map Controls Toolbar'}
      >
        <button
          type="button"
          onClick={() => map.zoomIn()}
          title={isRtl ? 'تكبير (+)' : 'Zoom In (+)'}
          aria-label={isRtl ? 'تكبير الخريطة' : 'Zoom In'}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => map.zoomOut()}
          title={isRtl ? 'تصغير (-)' : 'Zoom Out (-)'}
          aria-label={isRtl ? 'تصغير الخريطة' : 'Zoom Out'}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-base border-t border-slate-200 dark:border-slate-800/80 pt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
        >
          −
        </button>
        <button
          type="button"
          onClick={onRecenter}
          title={isRtl ? 'إعادة ضبط الخريطة على مصر' : 'Reset View to Egypt'}
          aria-label={isRtl ? 'إعادة ضبط موقع الخريطة' : 'Reset Map View'}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 transition-colors border-t border-slate-200 dark:border-slate-800/80 pt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={cycleBasemap}
          title={`${isRtl ? 'تبديل طبقة الخريطة' : 'Switch Map Basemap'}: ${basemapTitles[basemapMode]}`}
          aria-label={isRtl ? 'تبديل طبقة الخريطة' : 'Switch Map Basemap'}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors border-t border-slate-200 dark:border-slate-800/80 pt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowLegend(prev => !prev)}
          title={isRtl ? (showLegend ? 'إخفاء الدليل' : 'إظهار الدليل') : (showLegend ? 'Hide Legend' : 'Show Legend')}
          aria-label={isRtl ? 'إظهار أو إخفاء دليل رموز الخريطة' : 'Toggle Map Legend'}
          aria-expanded={showLegend}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors border-t border-slate-200 dark:border-slate-800/80 pt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
            showLegend 
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isRtl ? (isFullscreen ? 'إنهاء ملء الشاشة (Esc)' : 'ملء الشاشة الكاملة') : (isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Map')}
          aria-label={isRtl ? 'تبديل وضع ملء الشاشة للخريطة' : 'Toggle Fullscreen Map'}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors border-t border-slate-200 dark:border-slate-800/80 pt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
            isFullscreen
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

interface ClusterItem {
  id: string;
  isCluster: boolean;
  coords: [number, number];
  projects: any[];
}

function ClusterInteractivePopup({
  projects,
  onSelectProject,
  router,
  isRtl,
}: {
  projects: any[];
  onSelectProject: (cp: any) => void;
  router: any;
  isRtl: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableScrollPropagation(containerRef.current);
      L.DomEvent.disableClickPropagation(containerRef.current);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      dir="rtl"
      className="p-3 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 dark:border-slate-800/90 backdrop-blur-xl shadow-2xl space-y-2 text-white min-w-[270px] max-w-[320px] text-start font-sans"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-100">
            {isRtl ? 'مشاريع هذا الموقع' : 'Location Projects'}
          </span>
        </div>
        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
          {projects.length} {isRtl ? 'مشاريع' : 'Projects'}
        </span>
      </div>

      <div className="space-y-1.5 max-h-52 overflow-y-auto pe-1">
        {projects.map((cp: any) => (
          <div
            key={cp.id}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-cyan-500/50 transition-all flex items-center justify-between gap-2 group"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProject(cp);
              }}
              className="flex-1 min-w-0 text-start cursor-pointer focus:outline-none"
              title={isRtl ? 'عرض كارت فحص المشروع في اللوحة الجانبية' : 'Inspect project in sidebar'}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_CONFIG[cp.status]?.fill || '#06B6D4' }}
                />
                <span className="font-bold text-xs text-slate-100 group-hover:text-cyan-300 truncate">
                  {cp.project_name || cp.name_ar}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5 ps-3.5">
                <bdi>#{cp.project_code || cp.code || '24-00'}</bdi>
                <span>•</span>
                <span className="truncate">{cp.client?.name_ar || cp.client_name_raw || (isRtl ? 'عميل' : 'Client')}</span>
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProject(cp);
                }}
                className="px-2 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-200 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                title={isRtl ? 'فحص المشروع في اللوحة الجانبية' : 'Inspect in sidebar'}
              >
                {isRtl ? 'فحص' : 'Inspect'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/projects/${cp.id}`);
                }}
                className="p-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-200 hover:text-white transition-all cursor-pointer"
                title={isRtl ? 'الانتقال إلى صفحة المشروع' : 'Open project page'}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-cyan-400/90 text-center pt-1 border-t border-slate-800/80 font-sans">
        {isRtl ? '💡 تم فتح قائمة مشاريع الموقع في اللوحة الجانبية' : '💡 Location projects listed in sidebar'}
      </div>
    </div>
  );
}

function ClusteredProjectMarkers({
  markers,
  selectedProject,
  createCustomIcon,
  createClusterIcon,
  handleSelectMarker,
  onSelectCluster,
  router,
  formatCurrency,
  isRtl,
}: {
  markers: Array<any>;
  selectedProject: Project | null;
  createCustomIcon: (status?: string, isSelected?: boolean) => L.DivIcon;
  createClusterIcon: (count: number, hasSelected?: boolean) => L.DivIcon;
  handleSelectMarker: (p: any, fromCluster?: boolean) => void;
  onSelectCluster?: (projects: any[]) => void;
  router: any;
  formatCurrency: (val: number) => string;
  isRtl: boolean;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useEffect(() => {
    const onZoomEnd = () => setZoom(map.getZoom());
    map.on('zoomend', onZoomEnd);
    return () => {
      map.off('zoomend', onZoomEnd);
    };
  }, [map]);

  const clusters = useMemo<ClusterItem[]>(() => {
    if (markers.length === 0) return [];
    // At high street-level zoom (>= 15), do not cluster unless coordinates overlap tightly
    const clusterRadiusPx = zoom >= 15 ? 16 : zoom >= 12 ? 36 : zoom >= 9 ? 44 : 52;

    const result: ClusterItem[] = [];
    const assigned = new Set<string>();

    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      if (assigned.has(m.id)) continue;

      const mPoint = map.project(L.latLng(m.coords[0], m.coords[1]), zoom);
      const group = [m];
      assigned.add(m.id);

      for (let j = i + 1; j < markers.length; j++) {
        const other = markers[j];
        if (assigned.has(other.id)) continue;

        const otherPoint = map.project(L.latLng(other.coords[0], other.coords[1]), zoom);
        if (mPoint.distanceTo(otherPoint) <= clusterRadiusPx) {
          group.push(other);
          assigned.add(other.id);
        }
      }

      if (group.length === 1) {
        result.push({
          id: m.id,
          isCluster: false,
          coords: m.coords,
          projects: group,
        });
      } else {
        const avgLat = group.reduce((sum, p) => sum + p.coords[0], 0) / group.length;
        const avgLng = group.reduce((sum, p) => sum + p.coords[1], 0) / group.length;
        result.push({
          id: `cluster-${group.map(p => p.id).join('-')}`,
          isCluster: true,
          coords: [avgLat, avgLng],
          projects: group,
        });
      }
    }

    return result;
  }, [markers, zoom, map]);

  const handleClusterClick = (cluster: ClusterItem) => {
    if (cluster.projects.length <= 1) return;
    onSelectCluster?.(cluster.projects);
    const lats = cluster.projects.map(p => p.coords[0]);
    const lngs = cluster.projects.map(p => p.coords[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    if (!isLeafletMapAlive(map)) return;
    map.stop();
    if (maxLat - minLat > 0.005 || maxLng - minLng > 0.005) {
      map.fitBounds(
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        { padding: [50, 50], maxZoom: 15 }
      );
    } else {
      map.flyTo(cluster.coords, Math.min(map.getZoom() + 2, 16), { duration: 0.6 });
    }
  };

  return (
    <>
      {clusters.map((item) => {
        if (item.isCluster) {
          const hasSelected = Boolean(selectedProject && item.projects.some(p => p.id === selectedProject.id));
          const clusterIcon = createClusterIcon(item.projects.length, hasSelected);
          if (!clusterIcon) return null;

          return (
            <Marker
              key={item.id}
              position={item.coords}
              icon={clusterIcon}
              eventHandlers={{
                click: () => handleClusterClick(item),
              }}
            >
              <Popup className="custom-leaflet-popup" minWidth={280} maxWidth={340} offset={[0, -18]}>
                <ClusterInteractivePopup
                  projects={item.projects}
                  onSelectProject={(cp) => handleSelectMarker(cp, true)}
                  router={router}
                  isRtl={isRtl}
                />
              </Popup>
            </Marker>
          );
        }

        // Single Project Marker
        const p = item.projects[0];
        const isSelected = selectedProject?.id === p.id;
        const icon = createCustomIcon(p.status, isSelected);
        if (!icon) return null;

        return (
          <Marker
            key={p.id}
            position={p.coords}
            icon={icon}
            eventHandlers={{
              click: () => handleSelectMarker(p),
              dblclick: () => {
                router.push(`/projects/${p.id}`);
              },
            }}
          >
            <Tooltip 
              sticky 
              direction="top" 
              offset={[0, -28]}
              className="custom-leaflet-glass-tooltip"
            >
              <div 
                dir="rtl" 
                className="p-3 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 dark:border-slate-800/90 backdrop-blur-md shadow-2xl space-y-1.5 text-white min-w-[220px] max-w-[280px] text-start font-sans"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 gap-2">
                  <bdi className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                    #{p.project_code || p.code || '24-00'}
                  </bdi>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[p.status]?.bgClass || ''} ${STATUS_CONFIG[p.status]?.textClass || ''}`}>
                    {isRtl ? (STATUS_CONFIG[p.status]?.label || 'قيد التنفيذ') : (STATUS_CONFIG[p.status]?.labelEn || 'In Progress')}
                  </span>
                </div>

                <div className="font-bold text-xs leading-snug line-clamp-2 text-slate-100">
                  {p.project_name || p.name_ar}
                </div>

                <div className="space-y-0.5 text-[11px]">
                  <div className="text-emerald-400 font-medium truncate flex items-center gap-1">
                    <User className="w-3 h-3 shrink-0 text-emerald-500" />
                    <span className="truncate">{p.client?.name_ar || p.client_name_raw || (isRtl ? 'عميل خاص' : 'Private Client')}</span>
                  </div>
                  {(p.site_location_address || p.location) && (
                    <div className="text-slate-400 text-[10px] truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                      <span className="truncate">{p.site_location_address || p.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/80 font-mono">
                  <span className="text-slate-400">{isRtl ? 'قيمة العقد:' : 'Contract:'}</span>
                  <bdi className="text-emerald-300 font-bold">
                    {formatCurrency(Number(p.total_value_with_vat_egp || p.total_contract_value || p.contract_value || 0))}
                  </bdi>
                </div>

                <div className="text-[9px] text-cyan-400/80 text-center pt-0.5 font-sans border-t border-slate-800/40">
                  {isRtl ? '👆 انقر لعرض كارت الفحص' : '👆 Click to inspect project'}
                </div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

export const LocationAnalyticsMap: React.FC<LocationAnalyticsMapProps> = ({
  projects,
  allProjects,
  selectedRegion,
  selectedStatus,
  onRegionClick,
  onStatusClick,
  lang = 'ar',
}) => {
  const router = useRouter();
  const isRtl = lang === 'ar';
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isViewerOnly = roles.length > 0 && roles.every((r) => r.toLowerCase() === 'viewer') && !isAdmin;
  let canEditRbac = false;
  try {
    if (typeof accessControl.canEditPath === 'function') {
      canEditRbac = accessControl.canEditPath('/projects', roles, isAdmin, dbAccessRules);
    }
  } catch {
    canEditRbac = false;
  }
  const canEditProjects = !isViewerOnly && (isAdmin || canEditRbac);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);
  
  // Basemap & Display state
  const [basemapMode, setBasemapMode] = useState<'auto' | 'dark' | 'streets' | 'satellite'>('auto');
  const [showLegend, setShowLegend] = useState(true);

  // Local Map State
  const [mapStatusFilter, setMapStatusFilter] = useState<string>('ALL');
  const [mapSearch, setMapSearch] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClusterProjects, setSelectedClusterProjects] = useState<any[] | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [flyTarget, setFlyTarget] = useState<{ coords: [number, number]; zoom: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard shortcut: Esc to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Lock body scroll when fullscreen is active
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
    setLeafletReady(true);
  }, []);

  // Synchronize internal activeRegion and map view with external selectedRegion
  useEffect(() => {
    if (!selectedRegion || selectedRegion === 'all') {
      setActiveRegion((prev) => {
        if (prev !== 'all') {
          setFlyTarget({ coords: [29.0, 30.8], zoom: 6 });
        }
        return 'all';
      });
      return;
    }
    const macro = getMacroRegionId(selectedRegion);
    if (macro) {
      setActiveRegion(macro);
      if (macro === 'all') {
        setFlyTarget({ coords: [29.0, 30.8], zoom: 6 });
      } else if (macro === 'coast') {
        setFlyTarget({ coords: [31.05, 28.50], zoom: 9 });
      } else if (macro === 'cairo') {
        setFlyTarget({ coords: [30.02, 31.45], zoom: 10 });
      } else if (macro === 'gouna') {
        setFlyTarget({ coords: [27.34, 33.68], zoom: 11 });
      } else if (macro === 'upper') {
        setFlyTarget({ coords: [25.69, 32.64], zoom: 11 });
      }
    }
  }, [selectedRegion]);

  // Synchronize internal mapStatusFilter with external selectedStatus prop
  useEffect(() => {
    if (selectedStatus === undefined) return;
    const normalized =
      !selectedStatus || selectedStatus.trim().toLowerCase() === 'all'
        ? 'ALL'
        : selectedStatus.trim();
    setMapStatusFilter((prev) => (prev !== normalized ? normalized : prev));
  }, [selectedStatus]);

  useEffect(() => {
    const checkDark = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Filter projects by region, status & search
  const filteredMapProjects = useMemo(() => {
    return projects.filter((p) => {
      if (activeRegion !== 'all' && !matchesRegionFilter(p, activeRegion)) return false;
      if (mapStatusFilter !== 'ALL' && p.status !== mapStatusFilter) return false;
      if (mapSearch.trim() !== '') {
        const query = mapSearch.toLowerCase();
        const code = (p.project_code || p.code || '').toLowerCase();
        const name = (p.project_name || p.name_ar || '').toLowerCase();
        const client = (p.client_name_raw || p.client?.name_ar || p.client?.name_en || '').toLowerCase();
        const region = (p.governorate?.name_ar || p.site_location_address || p.location || '').toLowerCase();
        if (!code.includes(query) && !name.includes(query) && !client.includes(query) && !region.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [projects, activeRegion, mapStatusFilter, mapSearch]);

  // Project marker locations with verified Egyptian GPS coordinates and deterministic jitter
  const mapMarkers = useMemo(() => {
    return filteredMapProjects.map((p) => {
      const directLat = p.latitude ?? p.gps_lat ?? p.location_gps_lat;
      const directLng = p.longitude ?? p.gps_lng ?? p.location_gps_lng;
      const hasDirectGps = directLat && directLng && Number(directLat) !== 0 && Number(directLng) !== 0;

      const base = resolveProjectCoords(p);
      // Deterministic seed based on project ID/code so coordinates never jump during search or filtering
      const seed = (p.id || p.project_code || '0').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const jitterLat = hasDirectGps ? 0 : (((seed * 17) % 21) - 10) * 0.001;
      const jitterLng = hasDirectGps ? 0 : (((seed * 23) % 21) - 10) * 0.001;

      return {
        ...p,
        coords: [base[0] + jitterLat, base[1] + jitterLng] as [number, number],
        isApproximate: !hasDirectGps,
      };
    });
  }, [filteredMapProjects]);

  // Regions summary counts calculated from the full dataset (not self-collapsing to 0 on active region)
  const regionSourceProjects = allProjects && allProjects.length > 0 ? allProjects : projects;

  // Region-scoped base projects (before status filter) so status filter pills show accurate counts
  const regionScopedBaseProjects = useMemo(() => {
    return regionSourceProjects.filter((p) => {
      if (activeRegion !== 'all' && !matchesRegionFilter(p, activeRegion)) return false;
      if (mapSearch.trim() !== '') {
        const query = mapSearch.toLowerCase();
        const code = (p.project_code || p.code || '').toLowerCase();
        const name = (p.project_name || p.name_ar || '').toLowerCase();
        const client = (p.client_name_raw || p.client?.name_ar || p.client?.name_en || '').toLowerCase();
        const region = (p.governorate?.name_ar || p.site_location_address || p.location || '').toLowerCase();
        if (!code.includes(query) && !name.includes(query) && !client.includes(query) && !region.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [regionSourceProjects, activeRegion, mapSearch]);

  const statusPillCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: regionScopedBaseProjects.length,
      working: 0,
      finished: 0,
      handing_over: 0,
      on_hold: 0,
      cancelled: 0,
    };
    regionScopedBaseProjects.forEach((p) => {
      if (p.status && counts[p.status] !== undefined) {
        counts[p.status] += 1;
      }
    });
    return counts;
  }, [regionScopedBaseProjects]);

  const regionCounts = useMemo(() => {
    let coast = 0;
    let cairo = 0;
    let gouna = 0;
    let upper = 0;

    regionSourceProjects.forEach((p) => {
      const reg = getProjectMacroRegion(p);
      if (reg === 'coast') coast++;
      else if (reg === 'cairo') cairo++;
      else if (reg === 'gouna') gouna++;
      else if (reg === 'upper') upper++;
    });

    return { total: regionSourceProjects.length, coast, cairo, gouna, upper };
  }, [regionSourceProjects]);

  // Memoized & Cached Custom Marker Icon Generator with pin geometry
  const iconCache = useMemo(() => new Map<string, L.DivIcon>(), []);
  const createCustomIcon = useCallback((status: string = 'working', isSelected: boolean = false) => {
    const key = `${status}:${isSelected}`;
    if (!iconCache.has(key)) {
      const config = STATUS_CONFIG[status] || STATUS_CONFIG.working;
      const size = isSelected ? 34 : 26;
      const glow = isSelected ? `drop-shadow(0 0 12px ${config.fill})` : `drop-shadow(0 0 5px ${config.fill}cc)`;

      const svgIcon = `
        <div style="filter: ${glow}; transform: translate(-50%, -100%); width: ${size}px; height: ${size + 8}px; position: relative;">
          ${isSelected ? `<span style="position: absolute; inset: -4px; border-radius: 9999px; background-color: ${config.fill}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>` : ''}
          <svg width="${size}" height="${size + 8}" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 32 12 32C12 32 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="${config.fill}" stroke="#FFFFFF" stroke-width="1.8"/>
            <circle cx="12" cy="12" r="5" fill="#FFFFFF"/>
            ${isSelected ? '<circle cx="12" cy="12" r="2.8" fill="' + config.fill + '"/>' : ''}
          </svg>
        </div>
      `;

      iconCache.set(key, L.divIcon({
        html: svgIcon,
        className: 'custom-pzone-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }));
    }
    return iconCache.get(key)!;
  }, [iconCache]);

  // Memoized & Cached Custom Cluster Marker Icon Generator with brand colors (#2563eb / emerald / amber) and clear numeric badges
  const clusterIconCache = useMemo(() => new Map<string, L.DivIcon>(), []);
  const createClusterIcon = useCallback((count: number, hasSelected: boolean = false) => {
    const key = `${count}:${hasSelected}`;
    if (!clusterIconCache.has(key)) {
      let bg = '#f59e0b';
      let ringBg = 'rgba(245, 158, 11, 0.25)';
      let borderColor = 'rgba(245, 158, 11, 0.6)';
      let size = 32;
      let fontSize = 11;
      let brandClass = 'pzone-cluster-amber';

      if (count >= 10) {
        bg = '#2563eb';
        ringBg = 'rgba(37, 99, 235, 0.25)';
        borderColor = 'rgba(37, 99, 235, 0.6)';
        size = 42;
        fontSize = 13;
        brandClass = 'pzone-cluster-blue';
      } else if (count >= 5) {
        bg = '#10b981';
        ringBg = 'rgba(16, 185, 129, 0.25)';
        borderColor = 'rgba(16, 185, 129, 0.6)';
        size = 36;
        fontSize = 12;
        brandClass = 'pzone-cluster-emerald';
      }

      const pulseRing = hasSelected
        ? `<span style="position: absolute; inset: -6px; border-radius: 9999px; background-color: ${bg}; opacity: 0.45; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
        : '';

      const html = `
        <div class="pzone-cluster-marker ${brandClass}" style="transform: translate(-50%, -50%); position: relative; width: ${size}px; height: ${size}px; cursor: pointer;">
          ${pulseRing}
          <div style="position: absolute; inset: -4px; border-radius: 9999px; background: ${ringBg}; border: 1.5px solid ${borderColor};"></div>
          <div class="pzone-cluster-badge" style="
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 9999px;
            background: ${bg};
            border: 2px solid #ffffff;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: ${fontSize}px;
              font-weight: 900;
              color: #ffffff;
              line-height: 1;
              letter-spacing: -0.02em;
              text-shadow: 0 1px 2px rgba(0,0,0,0.4);
            ">${count}</span>
          </div>
        </div>
      `;

      clusterIconCache.set(key, L.divIcon({
        html,
        className: 'custom-cluster-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      }));
    }
    return clusterIconCache.get(key)!;
  }, [clusterIconCache]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatCurrency = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)} ${isRtl ? 'مليار ج.م' : 'B EGP'}`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} ${isRtl ? 'مليون ج.م' : 'M EGP'}`;
    return `${new Intl.NumberFormat(isRtl ? 'ar-EG' : 'en-US').format(val)} ${isRtl ? 'ج.م' : 'EGP'}`;
  };

  const handleFlyToRegion = (region: string) => {
    setActiveRegion(region);
    onRegionClick?.(region);
    if (region === 'all') {
      setFlyTarget({ coords: [29.0, 30.8], zoom: 6 });
    } else if (region === 'coast') {
      setFlyTarget({ coords: [31.05, 28.50], zoom: 9 });
    } else if (region === 'cairo') {
      setFlyTarget({ coords: [30.02, 31.45], zoom: 10 });
    } else if (region === 'gouna') {
      setFlyTarget({ coords: [27.34, 33.68], zoom: 11 });
    } else if (region === 'upper') {
      setFlyTarget({ coords: [25.69, 32.64], zoom: 11 });
    }
  };

  const handleStatusFilter = (status: string) => {
    setMapStatusFilter(status);
    onStatusClick?.(status === 'ALL' ? 'all' : status);
  };

  const handleResetMapFilters = () => {
    setMapSearch('');
    setMapStatusFilter('ALL');
    setActiveRegion('all');
    setSelectedProject(null);
    setSelectedClusterProjects(null);
    onStatusClick?.('all');
    onRegionClick?.('all');
    setFlyTarget({ coords: [29.0, 30.8], zoom: 6 });
  };

  const handleSelectMarker = (p: any, fromCluster: boolean = false) => {
    setSelectedProject(p);
    if (!fromCluster) {
      if (!selectedClusterProjects?.some(cp => cp.id === p.id)) {
        setSelectedClusterProjects(null);
      }
    }
    setFlyTarget({ coords: p.coords, zoom: 14 });
  };

  const handleSelectCluster = (clusterProjects: any[]) => {
    setSelectedClusterProjects(clusterProjects);
    setSelectedProject(null);
  };

  const handleRecenterEgypt = () => {
    setActiveRegion('all');
    onRegionClick?.('all');
    setFlyTarget({ coords: [29.0, 30.8], zoom: 6 });
  };

  // Tiles resolved centrally (keyless CARTO tiles show "API KEY REQUIRED").
  const resolvedBasemap = useMemo(() => resolveBasemap(basemapMode, isDarkMode), [basemapMode, isDarkMode]);
  const [activeBasemap, setActiveBasemap] = useState<Basemap>(resolvedBasemap);
  const [resilienceNotice, setResilienceNotice] = useState<string | null>(null);
  const tileMonitorRef = useRef<TileHealthMonitor | null>(null);

  // Synchronize activeBasemap when user toggles mode/theme
  useEffect(() => {
    setActiveBasemap(resolvedBasemap);
    setResilienceNotice(null);
    tileMonitorRef.current = new TileHealthMonitor({
      errorThreshold: 3,
      errorWindowMs: 8000,
      onFailover: (fallback, count) => {
        console.warn(`[LocationAnalyticsMap] Primary provider failed (${count} tile errors). Switching to fallback: ${fallback.name}`);
        setActiveBasemap({
          id: resolvedBasemap.id,
          url: fallback.url,
          attribution: fallback.attribution,
          maxZoom: fallback.maxZoom,
          maxNativeZoom: fallback.maxNativeZoom,
          subdomains: fallback.subdomains,
          fallbacks: resolvedBasemap.fallbacks.filter((f) => f.id !== fallback.id),
        });
        setResilienceNotice(
          isRtl
            ? `تم التحويل تلقائياً إلى طبقة بديلة (${fallback.name}) لضمان استقرار الخريطة`
            : `Automatically switched to fallback map layer (${fallback.name})`
        );
      },
    });
  }, [resolvedBasemap, isRtl]);

  const currentBasemapLabel = useMemo(() => {
    if (basemapMode === 'auto') return isRtl ? (isDarkMode ? 'داكن (تلقائي)' : 'شوارع (تلقائي)') : (isDarkMode ? 'Dark (Auto)' : 'Streets (Auto)');
    if (basemapMode === 'dark') return isRtl ? 'داكن' : 'Dark';
    if (basemapMode === 'streets') return isRtl ? 'شوارع' : 'Streets';
    return isRtl ? 'أقمار صناعية' : 'Satellite';
  }, [basemapMode, isDarkMode, isRtl]);

  return (
    <div 
      role="region"
      aria-labelledby="gis-map-heading"
      aria-describedby="gis-map-desc"
      className={`rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl overflow-hidden flex flex-col space-y-0 transition-colors ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen rounded-none border-0 m-0'
          : ''
      }`}
    >
      {/* Upper Control Bar */}
      <header className="p-4 bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 id="gis-map-heading" className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              {isRtl ? 'الخريطة الجغرافية الحقيقية للمشاريع (GIS Operations Hub)' : 'Real Geographic Project GIS Operations Hub'}
              <span 
                className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full"
                aria-live="polite"
              >
                {mapMarkers.length} {isRtl ? 'موقع حقيقي' : 'Live Sites'}
              </span>
            </h3>
            <p id="gis-map-desc" className="text-xs text-slate-500 dark:text-slate-400">
              {isRtl 
                ? 'عرض مواقع مشاريع P-Zone وإحداثياتها الجغرافية ومطابقة الشركات المطورة' 
                : 'Displaying P-Zone project sites, GIS coordinates, and developer matching'}
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Quick Search Input */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              aria-label={isRtl ? 'بحث في مشاريع الخريطة' : 'Search map projects'}
              placeholder={isRtl ? 'بحث بالمشروع، العميل، الكود...' : 'Search by project, client, code...'}
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              className="glass-input w-full ps-10 pe-9 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            {mapSearch && (
              <button 
                type="button"
                onClick={() => setMapSearch('')} 
                aria-label={isRtl ? 'مسح البحث' : 'Clear search'}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Status Filter Pills */}
          <div 
            role="group" 
            aria-label={isRtl ? 'تصفية المشاريع بحالة التنفيذ' : 'Filter projects by status'} 
            className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto max-w-full no-scrollbar"
          >
            <button
              type="button"
              onClick={() => handleStatusFilter('ALL')}
              aria-pressed={mapStatusFilter === 'ALL'}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                mapStatusFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRtl ? 'الكل' : 'All'} ({statusPillCounts.ALL})
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleStatusFilter(key)}
                aria-pressed={mapStatusFilter === key}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  mapStatusFilter === key
                    ? `${cfg.bgClass} ${cfg.textClass} border shadow-sm`
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.fill }} />
                <span>{isRtl ? cfg.label : cfg.labelEn}</span>
                <span className="text-[10px] font-mono opacity-80">({statusPillCounts[key] ?? 0})</span>
              </button>
            ))}
          </div>

          {/* Fullscreen Toggle Button in Header */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isRtl ? (isFullscreen ? 'إنهاء ملء الشاشة (Esc)' : 'عرض الخريطة ملء الشاشة') : (isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Map')}
            aria-label={isRtl ? 'تبديل وضع ملء الشاشة للخريطة' : 'Toggle Fullscreen Map'}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer shrink-0 ${
              isFullscreen
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-500" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
            <span className="hidden sm:inline">{isFullscreen ? (isRtl ? 'إنهاء ملء الشاشة' : 'Exit') : (isRtl ? 'ملء الشاشة' : 'Fullscreen')}</span>
          </button>
        </div>
      </header>

      {/* Region Fast Zoom Bar */}
      <nav 
        aria-label={isRtl ? 'التركيز الجغرافي السريع' : 'Quick Regional Navigation'}
        className="px-4 py-2 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2"
      >
        <div className="flex items-center gap-1 font-bold text-slate-500 dark:text-slate-400 shrink-0">
          <Navigation className="w-3.5 h-3.5 text-cyan-500" />
          <span>{isRtl ? 'التركيز الجغرافي السريع:' : 'Quick Regional Zoom:'}</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => handleFlyToRegion('all')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap shrink-0 ${
              activeRegion === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {isRtl ? '🇪🇬 مصر بالكامل' : '🇪🇬 All Egypt'} ({regionCounts.total})
          </button>

          <button
            type="button"
            onClick={() => handleFlyToRegion('coast')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap shrink-0 ${
              activeRegion === 'coast'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-cyan-500/10 dark:hover:bg-cyan-950/40'
            }`}
          >
            {isRtl ? '🏖️ الساحل الشمالي والعلمين' : '🏖️ North Coast & Alamein'} ({regionCounts.coast})
          </button>

          <button
            type="button"
            onClick={() => handleFlyToRegion('cairo')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap shrink-0 ${
              activeRegion === 'cairo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10 dark:hover:bg-emerald-950/40'
            }`}
          >
            {isRtl ? '🏛️ القاهرة الكبرى والعاصمة' : '🏛️ Greater Cairo & New Capital'} ({regionCounts.cairo})
          </button>

          <button
            type="button"
            onClick={() => handleFlyToRegion('gouna')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap shrink-0 ${
              activeRegion === 'gouna'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 dark:hover:bg-amber-950/40'
            }`}
          >
            {isRtl ? '🌊 الجونة والبحر الأحمر' : '🌊 El Gouna & Red Sea'} ({regionCounts.gouna})
          </button>

          <button
            type="button"
            onClick={() => handleFlyToRegion('upper')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeRegion === 'upper'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-purple-500/10 dark:hover:bg-purple-950/40'
            }`}
          >
            {isRtl ? '🌴 الأقصر والصعيد' : '🌴 Luxor & Upper Egypt'} ({regionCounts.upper})
          </button>
        </div>

        {/* Direct 1-Click Basemap Layer Switcher */}
        <div
          role="group"
          aria-label={isRtl ? 'طبقة الخريطة الأساسية' : 'Basemap Layer'}
          className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-500 ms-1.5 me-0.5 shrink-0" aria-hidden="true" />
          {(
            [
              { id: 'auto', ar: 'تلقائي', en: 'Auto' },
              { id: 'streets', ar: 'شوارع تفصيلية', en: 'Streets' },
              { id: 'satellite', ar: 'أقمار صناعية', en: 'Satellite' },
              { id: 'dark', ar: 'داكن', en: 'Dark' },
            ] as const
          ).map((layerOpt) => (
            <button
              key={layerOpt.id}
              type="button"
              onClick={() => setBasemapMode(layerOpt.id)}
              aria-pressed={basemapMode === layerOpt.id}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                basemapMode === layerOpt.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRtl ? layerOpt.ar : layerOpt.en}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Map Body Split: Interactive Map / Project Quick Inspector Panel */}
      <div className={`relative w-full flex overflow-hidden transition-all ${
        isFullscreen
          ? 'flex-1 h-full min-h-0'
          : 'h-[440px] sm:h-[500px] md:h-[560px] lg:h-[620px] xl:h-[660px]'
      }`}>
        
        {/* Mobile Backdrop when Project Inspector is open on small screens */}
        {(selectedProject || (selectedClusterProjects && selectedClusterProjects.length > 0)) && (
          <div 
            onClick={() => {
              setSelectedProject(null);
              setSelectedClusterProjects(null);
            }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
            aria-hidden="true"
          />
        )}

        {/* Project Quick Inspector Panel */}
        <aside 
          aria-label={isRtl ? 'كارت فحص المشروع المحدد' : 'Selected Project Inspector'}
          className={`
            fixed lg:relative inset-x-0 bottom-0 lg:inset-auto z-40 lg:z-20
            max-h-[85vh] lg:max-h-none h-auto lg:h-full
            w-full lg:w-[450px] xl:w-[480px] shrink-0
            border-t lg:border-t-0 border-e border-slate-200 dark:border-slate-800
            bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl
            rounded-t-3xl lg:rounded-none shadow-2xl lg:shadow-none
            overflow-y-auto transition-all duration-300 ease-out
            ${(selectedProject || (selectedClusterProjects && selectedClusterProjects.length > 0)) ? 'translate-y-0 opacity-100' : 'translate-y-full lg:translate-y-0 hidden lg:block opacity-0 lg:opacity-100'}
          `}
        >
          {/* Mobile Drag Indicator Bar */}
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 lg:hidden" />

          {selectedProject ? (
            <div dir="rtl" className="p-5 space-y-4 text-start font-sans">
              {/* Back to cluster link & sibling pills if arrived from a cluster */}
              {selectedClusterProjects && selectedClusterProjects.length > 1 && (
                <div className="flex items-center justify-between bg-slate-200/80 dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-300/80 dark:border-slate-800 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                    <span>{isRtl ? 'مشاريع الموقع' : 'Location projects'}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-[10px] font-mono font-bold">
                      {selectedClusterProjects.length}
                    </span>
                  </button>

                  <div className="flex items-center gap-1 overflow-x-auto max-w-[160px] sm:max-w-[190px] no-scrollbar">
                    {selectedClusterProjects.map((sibling) => {
                      const isCurrent = sibling.id === selectedProject.id;
                      return (
                        <button
                          key={sibling.id}
                          type="button"
                          onClick={() => setSelectedProject(sibling)}
                          className={`h-6 px-1.5 rounded-md flex items-center gap-1 text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
                            isCurrent
                              ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                          title={sibling.project_name || sibling.name_ar}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: STATUS_CONFIG[sibling.status]?.fill || '#06B6D4' }}
                          />
                          <span>{sibling.project_code ? sibling.project_code.slice(-2) : '•'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    {isRtl ? 'كارت فحص المشروع' : 'Project Inspection'}
                  </span>
                  <bdi className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    #{selectedProject.project_code || selectedProject.code || '24-00'}
                  </bdi>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProject(null);
                    setSelectedClusterProjects(null);
                  }}
                  aria-label={isRtl ? 'إغلاق كارت الفحص' : 'Close project inspection card'}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Water Scope Graphic Header Banner */}
              <div className="relative h-28 rounded-2xl bg-gradient-to-r from-emerald-950 via-cyan-900 to-slate-900 p-4 border border-cyan-500/30 shadow-inner flex flex-col justify-end overflow-hidden group">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative z-10 space-y-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[selectedProject.status]?.bgClass || ''} ${STATUS_CONFIG[selectedProject.status]?.textClass || ''}`}>
                    {isRtl 
                      ? (STATUS_CONFIG[selectedProject.status]?.label || 'قيد التنفيذ')
                      : (STATUS_CONFIG[selectedProject.status]?.labelEn || 'In Progress')}
                  </span>
                  <h3 className="text-sm font-black text-white leading-tight line-clamp-2">
                    {selectedProject.project_name || selectedProject.name_ar}
                  </h3>
                </div>
              </div>

              {/* Comprehensive Attributes Data Grid */}
              {(() => {
                const googleMapsLat = (selectedProject as any).coords?.[0] ?? selectedProject.latitude ?? selectedProject.gps_lat;
                const googleMapsLng = (selectedProject as any).coords?.[1] ?? selectedProject.longitude ?? selectedProject.gps_lng;
                const hasValidGps = Boolean(googleMapsLat && googleMapsLng && Number(googleMapsLat) !== 0 && Number(googleMapsLng) !== 0);
                const googleMapsUrl = hasValidGps
                  ? `https://www.google.com/maps/search/?api=1&query=${googleMapsLat},${googleMapsLng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      (selectedProject.project_name || selectedProject.name_ar || '') + ' ' + (selectedProject.site_location_address || selectedProject.location || 'مصر')
                    )}`;

                return (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold">
                          <User className="w-3 h-3 text-cyan-500" /> 
                          <span>{isRtl ? 'العميل المعتمد (Client)' : 'Approved Client'}</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate" title={selectedProject.client?.name_ar || selectedProject.client_name_raw || (isRtl ? 'عميل خاص' : 'Private Client')}>
                          {selectedProject.client?.name_ar || selectedProject.client_name_raw || (isRtl ? 'عميل خاص' : 'Private Client')}
                        </div>
                        {selectedProject.client?.name_en && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {selectedProject.client.name_en}
                          </div>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold">
                          <Building2 className="w-3 h-3 text-purple-500" /> 
                          <span>{isRtl ? 'مدير المشروع (PM)' : 'Project Manager (PM)'}</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate" title={selectedProject.pm_full_name || selectedProject.project_manager_name_raw || selectedProject.project_manager || (isRtl ? 'بدون' : 'Unassigned')}>
                          {selectedProject.pm_full_name || selectedProject.project_manager_name_raw || selectedProject.project_manager || (isRtl ? 'بدون' : 'Unassigned')}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold">
                            <MapPin className="w-3 h-3 text-emerald-500" /> 
                            <span>{isRtl ? 'الموقع الجغرافي' : 'Site Location'}</span>
                          </div>
                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-bold"
                            title={isRtl ? 'فتح في خرائط Google' : 'Open in Google Maps'}
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate" title={selectedProject.site_location_address || selectedProject.location || (isRtl ? 'مصر' : 'Egypt')}>
                          {selectedProject.site_location_address || selectedProject.location || (isRtl ? 'مصر' : 'Egypt')}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          {Number(selectedProject.latitude || selectedProject.gps_lat || 0) !== 0
                            ? `📍 ${Number(selectedProject.latitude || selectedProject.gps_lat).toFixed(4)}, ${Number(selectedProject.longitude || selectedProject.gps_lng).toFixed(4)}`
                            : (isRtl ? '⚠️ إحداثيات تقريبية (مركز المحافظة)' : '⚠️ Approx Coordinates (Gov Center)')}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold">
                          <DollarSign className="w-3 h-3 text-amber-500" /> 
                          <span>{isRtl ? 'قيمة العقد الإجمالية' : 'Total Contract Value'}</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 font-mono text-xs">
                          <bdi>{formatCurrency(getProjectValueWithVat(selectedProject))}</bdi>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold">
                          <Droplets className="w-3 h-3 text-cyan-500" /> 
                          <span>{isRtl ? 'التسطيح المائي (m²)' : 'Water Surface Area (m²)'}</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                          <span>{Number(selectedProject.water_area_m2 || selectedProject.total_water_area_m2 || 0).toLocaleString()}</span>{' '}
                          <bdi>{isRtl ? 'م²' : 'm²'}</bdi>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold">
                          <Layers className="w-3 h-3 text-emerald-500" /> 
                          <span>{isRtl ? 'التكعيب الهيدروليكي (m³)' : 'Hydraulic Volume (m³)'}</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                          <span>{Number(selectedProject.water_vol_m3 || selectedProject.total_water_volume_m3 || 0).toLocaleString()}</span>{' '}
                          <bdi>{isRtl ? 'م³' : 'm³'}</bdi>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      {/* Open in Google Maps in separate tab */}
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                        title={isRtl ? 'فتح موقع المشروع في صفحة منفصلة بخرائط Google' : 'Open project in separate page on Google Maps'}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>{isRtl ? 'فتح في خرائط Google (صفحة منفصلة)' : 'Open in Google Maps'}</span>
                      </a>

                      <Link
                        href={`/projects/${selectedProject.id}`}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>{isRtl ? 'فتح تفاصيل المشروع بالكامل' : 'Open Full Project Details'}</span>
                      </Link>

                      <div className={`grid ${canEditProjects ? 'grid-cols-2' : 'grid-cols-1'} gap-2 text-xs`}>
                        {canEditProjects && (
                          <Link
                            href={`/projects/${selectedProject.id}/edit`}
                            className="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopyCode(selectedProject.project_code || selectedProject.code || '24-00')}
                          className="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-cyan-500" />}
                          <span>{copiedCode ? (isRtl ? 'تم النسخ' : 'Copied') : (isRtl ? 'نسخ الكود' : 'Copy Code')}</span>
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : selectedClusterProjects && selectedClusterProjects.length > 0 ? (
            <div dir="rtl" className="p-5 space-y-4 text-start font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {isRtl ? 'مشاريع هذا الموقع' : 'Location Projects'}
                      <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                        {selectedClusterProjects.length} {isRtl ? 'مشاريع' : 'Projects'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isRtl ? 'انقر على أي مشروع لمعاينته أو الانتقال لصفحته مباشرة' : 'Click any project to inspect or open its page directly'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClusterProjects(null)}
                  aria-label={isRtl ? 'إغلاق القائمة' : 'Close list'}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Projects List */}
              <div className="space-y-3 max-h-[calc(100vh-280px)] lg:max-h-[520px] overflow-y-auto pe-1">
                {selectedClusterProjects.map((p) => {
                  const pValue = Number(p.total_value_with_vat_egp || p.total_contract_value || p.contract_value || 0);
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 shadow-sm hover:shadow-md transition-all space-y-2.5 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[p.status]?.bgClass || ''} ${STATUS_CONFIG[p.status]?.textClass || ''}`}>
                          {isRtl ? (STATUS_CONFIG[p.status]?.label || 'قيد التنفيذ') : (STATUS_CONFIG[p.status]?.labelEn || 'In Progress')}
                        </span>
                        <bdi className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          #{p.project_code || p.code || '24-00'}
                        </bdi>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedProject(p)}
                        className="w-full text-start cursor-pointer group"
                      >
                        <h5 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {p.project_name || p.name_ar}
                        </h5>
                      </button>

                      <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                            {p.client?.name_ar || p.client_name_raw || (isRtl ? 'عميل خاص' : 'Private Client')}
                          </span>
                        </div>
                        {pValue > 0 && (
                          <div className="flex items-center gap-1.5 font-mono">
                            <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300 font-bold">
                              {formatCurrency(pValue)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setSelectedProject(p)}
                          className="py-2 px-3 rounded-xl bg-cyan-600/10 hover:bg-cyan-600 text-cyan-700 dark:text-cyan-300 hover:text-white border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'فحص كامل' : 'Inspect'}</span>
                        </button>
                        <Link
                          href={`/projects/${p.id}`}
                          className="py-2 px-3 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'صفحة المشروع' : 'Open Page'}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div dir="rtl" className="flex flex-col items-center justify-center text-center p-8 h-full space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-inner">
                <Compass className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {isRtl ? 'مركز فحص ومطابقة المشاريع الجغرافي' : 'GIS Project Inspection & Matching Center'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  {isRtl 
                    ? 'انقر على أي دبوس مشروع بالخريطة لعرض تفاصيله، مديره، عميله الحقيقي، وموقعه على الخريطة' 
                    : 'Click any map marker pin to inspect project details, PM, client, and verified location'}
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Map Canvas Container */}
        <div 
          className="flex-1 relative z-10 w-full h-full"
          role="application"
          aria-label={isRtl ? 'خريطة المواقع الجغرافية التفاعلية للمشاريع' : 'Interactive Project Locations GIS Map'}
        >
          {!leafletReady ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-mono">
              {isRtl ? 'جاري تهيئة الخريطة...' : 'Initializing Map...'}
            </div>
          ) : (
            <MapContainer
              center={[29.0, 30.8]}
              zoom={6}
              zoomControl={false}
              scrollWheelZoom={true}
              className="w-full h-full"
              style={{ background: isDarkMode ? '#0B132B' : '#E2E8F0', height: '100%', width: '100%' }}
            >
              <MapController 
                targetCoords={flyTarget?.coords || null} 
                zoomLevel={flyTarget?.zoom || null} 
                isFullscreen={isFullscreen}
              />

              <MapFloatingControls
                isRtl={isRtl}
                basemapMode={basemapMode}
                setBasemapMode={setBasemapMode}
                showLegend={showLegend}
                setShowLegend={setShowLegend}
                onRecenter={handleRecenterEgypt}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
              />

              {resilienceNotice && (
                <div
                  role="status"
                  aria-live="polite"
                  className="absolute top-3 end-3 z-[800] bg-amber-500/90 dark:bg-amber-600/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 pointer-events-auto"
                >
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>{resilienceNotice}</span>
                </div>
              )}

              <TileLayer
                key={activeBasemap.url}
                attribution={activeBasemap.attribution}
                url={activeBasemap.url}
                maxZoom={activeBasemap.maxZoom}
                maxNativeZoom={activeBasemap.maxNativeZoom}
                keepBuffer={6}
                eventHandlers={{
                  tileerror: (event: any) => {
                    handleTileErrorWithFallback(event.tile, event.coords, activeBasemap.fallbacks);
                    tileMonitorRef.current?.registerTileError(activeBasemap);
                  },
                  tileload: () => {
                    tileMonitorRef.current?.registerTileSuccess();
                  },
                }}
                {...(activeBasemap.subdomains ? { subdomains: activeBasemap.subdomains } : {})}
              />

              {activeBasemap.labelOverlayUrl && (
                <TileLayer
                  key={`labels-${activeBasemap.labelOverlayUrl}`}
                  url={activeBasemap.labelOverlayUrl}
                  attribution=""
                  maxZoom={activeBasemap.maxZoom}
                  maxNativeZoom={activeBasemap.labelOverlayMaxNativeZoom ?? activeBasemap.maxNativeZoom}
                  opacity={0.94}
                  pane="overlayPane"
                  keepBuffer={6}
                />
              )}

              <ClusteredProjectMarkers
                markers={mapMarkers}
                selectedProject={selectedProject}
                createCustomIcon={createCustomIcon}
                createClusterIcon={createClusterIcon}
                handleSelectMarker={handleSelectMarker}
                onSelectCluster={handleSelectCluster}
                router={router}
                formatCurrency={formatCurrency}
                isRtl={isRtl}
              />
            </MapContainer>
          )}

          {/* Non-destructive Empty Filter Overlay inside Map Canvas (keeps map mounted) */}
          {leafletReady && mapMarkers.length === 0 && (
            <div
              role="status"
              aria-live="polite"
              className="absolute top-4 inset-x-0 mx-auto w-fit max-w-[90%] z-[780] pointer-events-auto bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl text-white flex flex-wrap items-center gap-3"
            >
              <span className="text-xs font-bold text-slate-200">
                {isRtl
                  ? 'لا توجد مواقع مطابقة للفلاتر المحددة حالياً على الخريطة'
                  : 'No project sites match the active map filters'}
              </span>
              <button
                type="button"
                onClick={handleResetMapFilters}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isRtl ? 'إعادة ضبط فلاتر الخريطة' : 'Reset Map Filters'}
              </button>
            </div>
          )}

          {/* Floating Accessible Map Legend */}
          {showLegend && (
            <div 
              dir="rtl"
              role="complementary"
              aria-label={isRtl ? 'دليل رموز الخريطة وحالات المشاريع' : 'Map Status & Symbol Legend'}
              className="absolute bottom-4 start-4 z-[750] pointer-events-auto max-w-[260px] sm:max-w-[300px] bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-white space-y-3 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-black text-slate-100">
                    {isRtl ? 'دليل رموز الخريطة' : 'Map Symbols & Status'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLegend(false)}
                  aria-label={isRtl ? 'إغلاق الدليل' : 'Close Legend'}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Items List */}
              <ul role="list" className="space-y-1.5 text-xs">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const count = mapMarkers.filter(m => m.status === key).length;
                  return (
                    <li key={key} className="flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                          style={{ backgroundColor: cfg.fill, boxShadow: `0 0 6px ${cfg.fill}88` }} 
                        />
                        <span className="text-slate-300 text-[11px] font-medium">
                          {isRtl ? cfg.label : cfg.labelEn}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Map Interaction Shortcuts */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[10px] text-slate-400 font-sans">
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <span>👆</span>
                  <span>{isRtl ? 'نقر مفرد: فحص تفاصيل المشروع' : 'Single Click: Inspect Card'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span>⚡</span>
                  <span>{isRtl ? 'نقر مزدوج: فتح صفحة المشروع' : 'Double Click: Open Page'}</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-800/50">
                  <span>{isRtl ? 'الطبقة الحالية:' : 'Layer:'}</span>
                  <span className="font-sans text-cyan-300 font-bold">{currentBasemapLabel}</span>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed Legend Trigger Pill */}
          {!showLegend && (
            <button
              type="button"
              onClick={() => setShowLegend(true)}
              aria-label={isRtl ? 'إظهار دليل رموز الخريطة' : 'Show Map Legend'}
              className="absolute bottom-4 start-4 z-[750] pointer-events-auto px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/80 dark:border-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xl backdrop-blur-md hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isRtl ? 'دليل الخريطة' : 'Map Legend'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { LocationAnalyticsMapSkeleton } from '../DashboardSkeletons';
