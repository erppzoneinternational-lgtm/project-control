import { describe, it, expect, vi } from 'vitest';
import {
  handleTileErrorWithFallback,
  TileHealthMonitor,
  createResilientTileLayer,
} from '../tileResilience';
import { resolveBasemap, formatTileUrl } from '../basemaps';

describe('handleTileErrorWithFallback', () => {
  it('applies first fallback url and increments fallbackAttempt on tile image element', () => {
    const basemap = resolveBasemap('streets', false);
    const mockTile = {
      src: basemap.url,
      dataset: {} as Record<string, string>,
    } as unknown as HTMLImageElement;

    const coords = { x: 10, y: 20, z: 5 };
    const applied = handleTileErrorWithFallback(mockTile, coords, basemap.fallbacks);

    expect(applied).toBe(true);
    expect(mockTile.dataset.fallbackAttempt).toBe('0');
    expect(mockTile.src).toBe(formatTileUrl(basemap.fallbacks[0].url, coords, basemap.fallbacks[0].subdomains));
  });

  it('cycles to next fallback if first fallback also fails', () => {
    const basemap = resolveBasemap('streets', false);
    const mockTile = {
      src: 'https://failed.example.com',
      dataset: { fallbackAttempt: '0' },
    } as unknown as HTMLImageElement;

    const coords = { x: 5, y: 5, z: 3 };
    const applied = handleTileErrorWithFallback(mockTile, coords, basemap.fallbacks);

    if (basemap.fallbacks.length > 1) {
      expect(applied).toBe(true);
      expect(mockTile.dataset.fallbackAttempt).toBe('1');
    }
  });

  it('returns false and stops when all fallbacks are exhausted', () => {
    const basemap = resolveBasemap('streets', false);
    const mockTile = {
      src: 'https://failed.example.com',
      dataset: { fallbackAttempt: String(basemap.fallbacks.length - 1) },
    } as unknown as HTMLImageElement;

    const coords = { x: 1, y: 1, z: 1 };
    const applied = handleTileErrorWithFallback(mockTile, coords, basemap.fallbacks);
    expect(applied).toBe(false);
  });

  it('handles null or missing tile / coords safely without throwing', () => {
    const basemap = resolveBasemap('streets', false);
    expect(handleTileErrorWithFallback(null, { x: 1, y: 1, z: 1 }, basemap.fallbacks)).toBe(false);
    expect(handleTileErrorWithFallback({} as any, null, basemap.fallbacks)).toBe(false);
    expect(handleTileErrorWithFallback({} as any, { x: 1, y: 1, z: 1 }, [])).toBe(false);
  });
});

describe('TileHealthMonitor', () => {
  it('triggers onFailover when error threshold is exceeded', () => {
    const basemap = resolveBasemap('satellite', true);
    const onFailover = vi.fn();
    const monitor = new TileHealthMonitor({
      errorThreshold: 3,
      errorWindowMs: 5000,
      onFailover,
    });

    monitor.registerTileError(basemap);
    expect(monitor.isFailedOver()).toBe(false);
    expect(onFailover).not.toHaveBeenCalled();

    monitor.registerTileError(basemap);
    expect(monitor.isFailedOver()).toBe(false);

    const triggeredFallback = monitor.registerTileError(basemap);
    expect(monitor.isFailedOver()).toBe(true);
    expect(onFailover).toHaveBeenCalledTimes(1);
    expect(onFailover).toHaveBeenCalledWith(basemap.fallbacks[0], 3);
    expect(triggeredFallback).toEqual(basemap.fallbacks[0]);
  });

  it('decays error count when tile loads succeed', () => {
    const basemap = resolveBasemap('streets', false);
    const monitor = new TileHealthMonitor({ errorThreshold: 3 });

    monitor.registerTileError(basemap);
    expect(monitor.getErrorCount()).toBe(1);

    monitor.registerTileSuccess();
    expect(monitor.getErrorCount()).toBe(0);
  });

  it('resets correctly', () => {
    const basemap = resolveBasemap('dark', true);
    const monitor = new TileHealthMonitor({ errorThreshold: 2 });

    monitor.registerTileError(basemap);
    monitor.registerTileError(basemap);
    expect(monitor.isFailedOver()).toBe(true);

    monitor.reset();
    expect(monitor.isFailedOver()).toBe(false);
    expect(monitor.getErrorCount()).toBe(0);
  });
});

describe('createResilientTileLayer', () => {
  it('binds tileerror and tileload event listeners on Leaflet layer', () => {
    const basemap = resolveBasemap('streets', false);
    const mockListeners: Record<string, Function> = {};
    const mockLayer = {
      on: vi.fn((event: string, cb: Function) => {
        mockListeners[event] = cb;
      }),
    };
    const mockL = {
      tileLayer: vi.fn(() => mockLayer),
    };

    const onFailover = vi.fn();
    const { layer, monitor } = createResilientTileLayer(mockL, basemap, {
      errorThreshold: 2,
      onFailover,
    });

    expect(mockL.tileLayer).toHaveBeenCalledWith(
      basemap.url,
      expect.objectContaining({
        attribution: basemap.attribution,
        maxZoom: basemap.maxZoom,
      })
    );
    expect(mockLayer.on).toHaveBeenCalledWith('tileerror', expect.any(Function));
    expect(mockLayer.on).toHaveBeenCalledWith('tileload', expect.any(Function));

    // Simulate tileerror events
    const fakeTile = { src: 'x', dataset: {} } as any;
    mockListeners['tileerror']({ tile: fakeTile, coords: { x: 1, y: 1, z: 2 } });
    mockListeners['tileerror']({ tile: fakeTile, coords: { x: 1, y: 1, z: 2 } });

    expect(monitor.isFailedOver()).toBe(true);
    expect(onFailover).toHaveBeenCalledTimes(1);
  });
});
