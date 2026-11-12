import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildGuidelineStyle } from '../ResizableTable';

describe('ResizableTable — Column Resize Guideline Isolation (Anti-Full-Width Banner Regression)', () => {
  it('computes strict 2px fixed guideline dimensions with right:auto and viewport clamping', () => {
    const style = buildGuidelineStyle(512.4, {
      top: 180,
      bottom: 540,
      height: 360,
      left: 100,
      right: 1100,
      width: 1000,
      x: 100,
      y: 180,
      toJSON: () => ({}),
    } as DOMRect);

    expect(style.position).toBe('fixed');
    expect(style.left).toBe('512px');
    expect(style.right).toBe('auto');
    expect(style.width).toBe('2px');
    expect(style.minWidth).toBe('2px');
    expect(style.maxWidth).toBe('2px');
    expect(style.top).toBe('180px');
    expect(style.height).toBe('360px');
    expect(style.pointerEvents).toBe('none');
    expect(style.zIndex).toBe(100060);
  });

  it('portals guideline to document.body and excludes it from #main-content > div 100% width override', () => {
    const tsxSource = readFileSync(join(process.cwd(), 'src/components/ui/ResizableTable.tsx'), 'utf8');
    const cssModule = readFileSync(join(process.cwd(), 'src/components/ui/ResizableTable.module.css'), 'utf8');
    const globalsCss = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

    expect(tsxSource).toContain('ReactDOM.createPortal(guidelineNode, document.body)');
    expect(tsxSource).toContain('data-resize-guideline="true"');
    expect(cssModule).toContain('width: 2px !important;');
    expect(cssModule).toContain('max-width: 2px !important;');
    expect(cssModule).toContain('right: auto !important;');
    expect(globalsCss).toContain(':not([data-resize-guideline])');
  });
});
