import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { resolveBasemap, formatTileUrl, type BasemapMode } from '../basemaps';

const MODES: BasemapMode[] = ['auto', 'streets', 'dark', 'satellite'];

describe('resolveBasemap', () => {
  it('never returns a keyless CARTO url in primary or fallback layers (CARTO now serves "API KEY REQUIRED" tiles)', () => {
    for (const mode of MODES) {
      for (const dark of [true, false]) {
        const b = resolveBasemap(mode, dark, undefined);
        expect(b.url).not.toContain('cartocdn.com');
        expect(b.url).toMatch(/^https:\/\//);
        expect(b.url).toContain('{z}');
        expect(b.attribution.length).toBeGreaterThan(0);
        for (const fb of b.fallbacks) {
          expect(fb.url).not.toContain('cartocdn.com');
        }
      }
    }
  });

  it('treats empty / whitespace key as no key', () => {
    expect(resolveBasemap('streets', false, '').url).not.toContain('cartocdn.com');
    expect(resolveBasemap('dark', true, '   ').url).not.toContain('cartocdn.com');
  });

  it('uses CARTO only when a key is provided, and always appends api_key', () => {
    const b = resolveBasemap('streets', false, 'abc 123');
    expect(b.url).toContain('cartocdn.com');
    expect(b.url).toContain('api_key=abc%20123');
    expect(resolveBasemap('dark', false, 'k').url).toContain('dark_all');
  });

  it('auto follows theme', () => {
    expect(resolveBasemap('auto', true, undefined).id).toBe('dark');
    expect(resolveBasemap('auto', false, undefined).id).toBe('streets');
  });

  it('satellite is keyless Esri imagery', () => {
    const b = resolveBasemap('satellite', true, 'k');
    expect(b.url).toContain('World_Imagery');
    expect(b.attribution).toContain('Esri');
  });

  it('sets maxNativeZoom so tiles upscale instead of going blank', () => {
    for (const mode of MODES) {
      const b = resolveBasemap(mode, false, undefined);
      expect(b.maxNativeZoom).toBeLessThanOrEqual(b.maxZoom);
    }
  });

  it('every basemap host is allowed by CSP img-src in next.config.ts', () => {
    const cfg = readFileSync(join(__dirname, '..', '..', '..', '..', 'next.config.ts'), 'utf8');
    const imgSrc = cfg.split('\n').find((l) => l.includes('img-src')) ?? '';
    for (const mode of MODES) {
      for (const key of [undefined, 'k']) {
        const host = new URL(resolveBasemap(mode, false, key).url.replace('{s}', 'a')).host;
        const wildcard = '*.' + host.split('.').slice(1).join('.');
        const allowed = imgSrc.includes(`https://${host}`) || imgSrc.includes(`https://${wildcard}`);
        expect(allowed, `CSP img-src missing ${host}`).toBe(true);
      }
    }
  });

  it('provides fallback tile layers for every mode with OpenStreetMap and CartoDB Positron coverage', () => {
    for (const mode of MODES) {
      for (const key of [undefined, 'k']) {
        const b = resolveBasemap(mode, false, key);
        expect(b.fallbacks).toBeDefined();
        expect(b.fallbacks.length).toBeGreaterThanOrEqual(1);

        for (const fb of b.fallbacks) {
          expect(fb.id).toBeDefined();
          expect(fb.name).toBeDefined();
          expect(fb.url).toMatch(/^https:\/\//);
          expect(fb.url).toContain('{z}');
          expect(fb.attribution.length).toBeGreaterThan(0);
          expect(fb.maxZoom).toBeGreaterThanOrEqual(18);
          expect(fb.maxNativeZoom).toBeGreaterThanOrEqual(16);
        }

        // Must include CartoDB Positron or OpenStreetMap in the fallback chain
        const fallbackIds = b.fallbacks.map((fb) => fb.id);
        const hasOsmOrPositron =
          fallbackIds.includes('osm-standard') || fallbackIds.includes('carto-positron');
        expect(hasOsmOrPositron, `Mode ${mode} missing OSM or Positron fallback`).toBe(true);
      }
    }
  });

  it('every fallback basemap host is allowed by CSP img-src in next.config.ts', () => {
    const cfg = readFileSync(join(__dirname, '..', '..', '..', '..', 'next.config.ts'), 'utf8');
    const imgSrc = cfg.split('\n').find((l) => l.includes('img-src')) ?? '';
    for (const mode of MODES) {
      for (const key of [undefined, 'k']) {
        const b = resolveBasemap(mode, false, key);
        for (const fb of b.fallbacks) {
          const host = new URL(fb.url.replace('{s}', 'a')).host;
          const wildcard = '*.' + host.split('.').slice(1).join('.');
          const allowed = imgSrc.includes(`https://${host}`) || imgSrc.includes(`https://${wildcard}`);
          expect(allowed, `CSP img-src missing fallback host ${host}`).toBe(true);
        }
      }
    }
  });

  it('formatTileUrl formats coordinates and subdomains safely without NaN or negative indices', () => {
    const template = 'https://{s}.example.com/{z}/{x}/{y}{r}.png';
    const formatted = formatTileUrl(template, { x: 10, y: 20, z: 5 }, 'abcd');
    expect(formatted).toBe('https://c.example.com/5/10/20.png');

    const formattedNegative = formatTileUrl(template, { x: -3, y: 1, z: 4 }, 'abcd');
    expect(formattedNegative).toBe('https://c.example.com/4/-3/1.png');
  });
});

describe('regression guard: no hardcoded tile providers outside basemaps.ts', () => {
  const srcRoot = join(__dirname, '..', '..', '..');
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name === '__tests__') continue;
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(name)) files.push(p);
    }
  };
  walk(srcRoot);

  it('no source file references cartocdn except lib/map/basemaps.ts', () => {
    const offenders = files
      .filter((f) => !f.replace(/\\/g, '/').endsWith('lib/map/basemaps.ts'))
      .filter((f) => readFileSync(f, 'utf8').includes('cartocdn.com'))
      .map((f) => relative(srcRoot, f));
    expect(offenders).toEqual([]);
  });
});
