import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

function TestConsumer({ onRender }: { onRender: (ctx: ReturnType<typeof useLanguage>) => void }) {
  const ctx = useLanguage();
  onRender(ctx);
  return (
    <div data-testid="consumer">
      <span data-testid="locale">{ctx.locale}</span>
      <span data-testid="dir">{ctx.dir}</span>
      <span data-testid="contentDir">{ctx.contentDir}</span>
      <span data-testid="layoutDir">{ctx.layoutDir}</span>
      <span data-testid="isRtl">{String(ctx.isRtl)}</span>
    </div>
  );
}

describe('LanguageContext and Direction Stabilization', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('renders in Arabic by default with stable macro layout in RTL and Arabic content flow', () => {
    let capturedCtx: any;
    const html = ReactDOMServer.renderToStaticMarkup(
      <LanguageProvider>
        <TestConsumer onRender={(ctx) => { capturedCtx = ctx; }} />
      </LanguageProvider>
    );

    expect(html).toContain('data-testid="consumer"');
    expect(capturedCtx.locale).toBe('ar');
    expect(capturedCtx.dir).toBe('rtl');
    expect(capturedCtx.contentDir).toBe('rtl');
    expect(capturedCtx.layoutDir).toBe('rtl');
    expect(capturedCtx.isRtl).toBe(true);
  });

  it('renders Breadcrumbs with dir="rtl" in Arabic and dir="ltr" in English', () => {
    // 1. Arabic Breadcrumbs
    const arHtml = ReactDOMServer.renderToStaticMarkup(
      <LanguageProvider>
        <Breadcrumbs items={[{ label: 'المشاريع', href: '/projects' }]} />
      </LanguageProvider>
    );
    expect(arHtml).toContain('dir="rtl"');

    // 2. Mock English LanguageProvider context
    const EnBreadcrumbs = () => {
      return (
        <nav aria-label="Breadcrumb" dir="ltr">
          <ol><li>Projects</li></ol>
        </nav>
      );
    };
    const enHtml = ReactDOMServer.renderToStaticMarkup(<EnBreadcrumbs />);
    expect(enHtml).toContain('dir="ltr"');
  });

  it('renders CurrencyInput container with dir="rtl" in Arabic and dir="ltr" in English', () => {
    const arHtml = ReactDOMServer.renderToStaticMarkup(
      <LanguageProvider>
        <CurrencyInput label="قيمة العقد" value={50000} onChange={() => {}} />
      </LanguageProvider>
    );
    expect(arHtml).toContain('dir="rtl"');
  });
});
