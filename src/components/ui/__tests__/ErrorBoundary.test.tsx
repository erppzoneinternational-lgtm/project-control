import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ErrorBoundary } from '../ErrorBoundary';

type ErrorBoundaryPrivate = {
  handleRetry: () => void;
  toggleDetails: () => void;
  handleCopy: () => Promise<void>;
};

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ErrorBoundary Component — Friendly Arabic Error Recovery Harness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children normally when no error occurs', () => {
    const html = renderToString(
      <ErrorBoundary>
        <div id="test-child">محتوى يعمل بشكل سليم تماماً</div>
      </ErrorBoundary>
    );

    expect(html).toContain('محتوى يعمل بشكل سليم تماماً');
    expect(html).not.toContain('تعذر تحميل هذا القسم حالياً');
  });

  it('returns updated state from getDerivedStateFromError', () => {
    const error = new Error('Database connection reset');
    const newState = ErrorBoundary.getDerivedStateFromError(error);

    expect(newState.hasError).toBe(true);
    expect(newState.error).toBe(error);
    expect(newState.showTechnicalDetails).toBe(false);
    expect(newState.copied).toBe(false);
  });

  it('renders default friendly Arabic recovery UI in error state', () => {
    const instance = new ErrorBoundary({
      children: <div>Child</div>,
    });
    instance.state = {
      hasError: true,
      error: new Error('Render exception'),
      showTechnicalDetails: false,
      copied: false,
    };

    const element = instance.render();
    const html = renderToString(element as React.ReactElement);

    // Assert friendly Arabic headings and messages
    expect(html).toContain('role="alert"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('تعذر تحميل هذا القسم حالياً');
    expect(html).toContain('نعتذر عن هذا التعثر غير المتوقع');
    expect(html).toContain('بياناتك ومؤشراتك الفنية بأمان');
    expect(html).toContain('إعادة المحاولة / Retry');
    expect(html).toContain('نسخ تقرير الدعم');
  });

  it('renders custom Arabic and English titles and messages when provided', () => {
    const instance = new ErrorBoundary({
      children: <div>Child</div>,
      fallbackTitleAr: 'تعذر تحميل جدول المقايسة BOQ',
      fallbackTitleEn: 'Failed to load BOQ table',
      fallbackMessageAr: 'حدث خطأ في قراءة بنود الأعمال، يمكنك إعادة المحاولة.',
      fallbackMessageEn: 'BOQ calculation interrupted.',
    });
    instance.state = {
      hasError: true,
      error: new Error('BOQ parse error'),
      showTechnicalDetails: false,
      copied: false,
    };

    const element = instance.render();
    const html = renderToString(element as React.ReactElement);

    expect(html).toContain('تعذر تحميل جدول المقايسة BOQ');
    expect(html).toContain('Failed to load BOQ table');
    expect(html).toContain('حدث خطأ في قراءة بنود الأعمال، يمكنك إعادة المحاولة.');
  });

  it('renders compact mode with friendly Arabic messaging and retry CTA', () => {
    const instance = new ErrorBoundary({
      children: <div>Child</div>,
      compact: true,
      fallbackTitleAr: 'تعذر تحميل بطاقة المؤشرات',
    });
    instance.state = {
      hasError: true,
      error: new Error('KPI timeout'),
      showTechnicalDetails: false,
      copied: false,
    };

    const element = instance.render();
    const html = renderToString(element as React.ReactElement);

    expect(html).toContain('role="alert"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('تعذر تحميل بطاقة المؤشرات');
    expect(html).toContain('KPI timeout');
    expect(html).toContain('إعادة المحاولة');
  });

  it('handles retry and triggers onReset callback', () => {
    const onResetMock = vi.fn();
    const instance = new ErrorBoundary({
      children: <div>Child</div>,
      onReset: onResetMock,
    });
    instance.state = {
      hasError: true,
      error: new Error('Gantt crashed'),
      showTechnicalDetails: true,
      copied: true,
    };
    instance.setState = vi.fn((update) => {
      const next = typeof update === 'function' ? update(instance.state) : update;
      instance.state = { ...instance.state, ...next };
    });

    // Invoke private handleRetry via method call
    (instance as unknown as ErrorBoundaryPrivate).handleRetry();

    expect(onResetMock).toHaveBeenCalledTimes(1);
    expect(instance.state.hasError).toBe(false);
    expect(instance.state.error).toBeNull();
    expect(instance.state.showTechnicalDetails).toBe(false);
    expect(instance.state.copied).toBe(false);
  });

  it('toggles technical details visibility state', () => {
    const instance = new ErrorBoundary({
      children: <div>Child</div>,
    });
    instance.state = {
      hasError: true,
      error: new Error('Null pointer'),
      showTechnicalDetails: false,
      copied: false,
    };
    instance.setState = vi.fn((update) => {
      const next = typeof update === 'function' ? update(instance.state) : update;
      instance.state = { ...instance.state, ...next };
    });

    (instance as unknown as ErrorBoundaryPrivate).toggleDetails();
    expect(instance.state.showTechnicalDetails).toBe(true);

    const openHtml = renderToString(instance.render() as React.ReactElement);
    expect(openHtml).toContain('إخفاء التفاصيل الفنية / Hide Details');
    expect(openHtml).toContain('Null pointer');

    (instance as unknown as ErrorBoundaryPrivate).toggleDetails();
    expect(instance.state.showTechnicalDetails).toBe(false);
  });

  it('renders home button when showHomeButton is enabled', () => {
    const instance = new ErrorBoundary({
      children: <div>Child</div>,
      showHomeButton: true,
      homeUrl: '/dashboard',
    });
    instance.state = {
      hasError: true,
      error: new Error('Crash'),
      showTechnicalDetails: false,
      copied: false,
    };

    const html = renderToString(instance.render() as React.ReactElement);
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('العودة للوحة القيادة');
  });

  it('formats error report when handleCopy is executed', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const error = new Error('Database schema synchronization failure');
    error.stack = 'Error: Database schema at file.ts:10:5';

    const instance = new ErrorBoundary({
      children: <div>Child</div>,
    });
    instance.state = {
      hasError: true,
      error,
      showTechnicalDetails: false,
      copied: false,
    };
    instance.setState = vi.fn((update) => {
      const next = typeof update === 'function' ? update(instance.state) : update;
      instance.state = { ...instance.state, ...next };
    });

    await (instance as unknown as ErrorBoundaryPrivate).handleCopy();

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const copiedPayload = writeTextMock.mock.calls[0][0];
    expect(copiedPayload).toContain('PZONE ERP ERROR REPORT');
    expect(copiedPayload).toContain('Database schema synchronization failure');
    expect(instance.state.copied).toBe(true);
  });
});
