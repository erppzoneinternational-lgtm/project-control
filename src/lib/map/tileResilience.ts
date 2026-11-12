import { Basemap, TileLayerFallback, formatTileUrl } from './basemaps';

export interface TileResilienceOptions {
  /** Number of consecutive or windowed tile errors before failing over to fallback layer */
  errorThreshold?: number;
  /** Milliseconds window to track error burst (default: 8000ms) */
  errorWindowMs?: number;
  /** Callback fired when an individual tile fails and attempts a fallback */
  onTileFallback?: (tile: HTMLImageElement, fallback: TileLayerFallback, attempt: number) => void;
  /** Callback fired when whole provider error threshold is exceeded */
  onFailover?: (fallback: TileLayerFallback, errorCount: number) => void;
}

/**
 * Handle individual tile error by attempting the next fallback layer in sequence.
 * Directly replaces tile.src to recover visual map display without awaiting full layer reload.
 * Returns true if a fallback was applied, false if all fallbacks exhausted.
 */
export function handleTileErrorWithFallback(
  tile: HTMLImageElement | null | undefined,
  coords: { x: number; y: number; z: number } | null | undefined,
  fallbacks: TileLayerFallback[] | undefined,
  onFallbackAttempt?: (tile: HTMLImageElement, fallback: TileLayerFallback, attempt: number) => void
): boolean {
  if (!tile || !coords || !fallbacks || fallbacks.length === 0) return false;

  const currentAttempt = parseInt(tile.dataset.fallbackAttempt || '-1', 10);
  const nextAttempt = currentAttempt + 1;

  if (nextAttempt >= fallbacks.length) {
    return false; // all fallbacks exhausted
  }

  const fallback = fallbacks[nextAttempt];
  tile.dataset.fallbackAttempt = String(nextAttempt);

  const fallbackUrl = formatTileUrl(fallback.url, coords, fallback.subdomains);
  tile.src = fallbackUrl;

  if (onFallbackAttempt) {
    onFallbackAttempt(tile, fallback, nextAttempt);
  }
  return true;
}

/**
 * Health monitor for tracking tile load failures and triggering provider failover.
 */
export class TileHealthMonitor {
  private errorCount = 0;
  private lastErrorTime = 0;
  private hasFailedOver = false;
  private errorThreshold: number;
  private errorWindowMs: number;
  private onFailover?: (fallback: TileLayerFallback, errorCount: number) => void;

  constructor(options?: TileResilienceOptions) {
    this.errorThreshold = options?.errorThreshold ?? 3;
    this.errorWindowMs = options?.errorWindowMs ?? 8000;
    this.onFailover = options?.onFailover;
  }

  public registerTileError(basemap: Basemap): TileLayerFallback | null {
    const now = Date.now();
    if (now - this.lastErrorTime > this.errorWindowMs) {
      this.errorCount = 0;
    }
    this.lastErrorTime = now;
    this.errorCount++;

    if (this.errorCount >= this.errorThreshold && !this.hasFailedOver && basemap.fallbacks?.length > 0) {
      this.hasFailedOver = true;
      const primaryFallback = basemap.fallbacks[0];
      if (this.onFailover) {
        this.onFailover(primaryFallback, this.errorCount);
      }
      return primaryFallback;
    }
    return null;
  }

  public registerTileSuccess(): void {
    if (this.errorCount > 0 && !this.hasFailedOver) {
      this.errorCount = Math.max(0, this.errorCount - 1);
    }
  }

  public reset(): void {
    this.errorCount = 0;
    this.lastErrorTime = 0;
    this.hasFailedOver = false;
  }

  public isFailedOver(): boolean {
    return this.hasFailedOver;
  }

  public getErrorCount(): number {
    return this.errorCount;
  }
}

/**
 * Creates a resilient Leaflet L.tileLayer with automatic tile-level fallback
 * and provider failover event listeners.
 */
export function createResilientTileLayer(
  L: any,
  basemap: Basemap,
  options?: TileResilienceOptions
) {
  const monitor = new TileHealthMonitor(options);

  const layer = L.tileLayer(basemap.url, {
    attribution: basemap.attribution,
    maxZoom: basemap.maxZoom,
    maxNativeZoom: basemap.maxNativeZoom,
    ...(basemap.subdomains ? { subdomains: basemap.subdomains } : {}),
  });

  layer.on('tileerror', (event: any) => {
    const tile = event.tile as HTMLImageElement;
    const coords = event.coords;

    // 1. Recover individual tile immediately with fallback
    handleTileErrorWithFallback(tile, coords, basemap.fallbacks, options?.onTileFallback);

    // 2. Track layer-level health for full provider failover
    monitor.registerTileError(basemap);
  });

  layer.on('tileload', () => {
    monitor.registerTileSuccess();
  });

  if (basemap.labelOverlayUrl && typeof L.layerGroup === 'function') {
    const labelLayer = L.tileLayer(basemap.labelOverlayUrl, {
      attribution: '',
      maxZoom: basemap.maxZoom,
      maxNativeZoom: basemap.labelOverlayMaxNativeZoom ?? basemap.maxNativeZoom,
      opacity: 0.92,
      pane: 'overlayPane',
    });
    return { layer: L.layerGroup([layer, labelLayer]), monitor };
  }

  return { layer, monitor };
}
