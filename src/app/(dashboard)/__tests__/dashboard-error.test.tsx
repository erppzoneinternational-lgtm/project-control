import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import DashboardErrorBoundary from '../error';

// Mock next/navigation
let mockPathname = '/dashboard';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('DashboardErrorBoundary Route Fallback — Friendly Arabic Error Recovery UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/dashboard';
  });

  it('renders friendly Arabic recovery UI with reassuring message', () => {
    const mockError = new Error('Calculation matrix failure');
    const mockReset = vi.fn();

    const html = renderToString(<DashboardErrorBoundary error={mockError} reset={mockReset} />);

    // Assert accessible alert attributes & RTL
    expect(html).toContain('role="alert"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('aria-live="assertive"');

    // Assert friendly Arabic messaging
    expect(html).toContain('تعذر تحميل لوحة العمليات والتحكم الرئيسية');
    expect(html).toContain('نعتذر عن هذا التعثر غير المتوقع في عرض بيانات هذه الصفحة');
    expect(html).toContain('بياناتك ومؤشراتك محفوظة بأمان');
    expect(html).toContain('نظام التعافي الذاتي من الأخطاء | Self-Healing Harness');
    expect(html).toContain('إعادة المحاولة (Try Again)');
    expect(html).toContain('العودة للوحة القيادة');
    expect(html).toContain('تحديث الصفحة');
    expect(html).toContain('نسخ تقرير الدعم الفني');
    expect(html).toContain('href="/dashboard"');
  });

  it('customizes Arabic title according to active dashboard route (e.g. /planning)', () => {
    mockPathname = '/planning';
    const mockError = new Error('CPM Graph engine failed');
    const mockReset = vi.fn();

    const html = renderToString(<DashboardErrorBoundary error={mockError} reset={mockReset} />);

    expect(html).toContain('تعذر تحميل منظومة التخطيط والبرامج الزمنية والـ Baselines');
    expect(html).toContain('إدارة التخطيط والبرامج الزمنية');
  });

  it('customizes Arabic title for /boq route', () => {
    mockPathname = '/boq';
    const mockError = new Error('BOQ rate breakdown syntax');
    const mockReset = vi.fn();

    const html = renderToString(<DashboardErrorBoundary error={mockError} reset={mockReset} />);

    expect(html).toContain('تعذر تحميل جدول الكميات والمقايسة التعاقدية (BOQ)');
    expect(html).toContain('المكتب الفني والتعاقدات');
  });

  it('customizes Arabic title for /cost-control route', () => {
    mockPathname = '/cost-control';
    const mockError = new Error('EVM curve calculation exception');
    const mockReset = vi.fn();

    const html = renderToString(<DashboardErrorBoundary error={mockError} reset={mockReset} />);

    expect(html).toContain('تعذر تحميل مراقبة التكاليف والتدفقات المالية');
    expect(html).toContain('الرقابة المالية والتكاليف');
  });

  it('customizes Arabic title for /contracts route', () => {
    mockPathname = '/contracts';
    const mockError = new Error('FIDIC clause analysis');
    const mockReset = vi.fn();

    const html = renderToString(<DashboardErrorBoundary error={mockError} reset={mockReset} />);

    expect(html).toContain('تعذر تحميل إدارة العقود والمطالبات والنزاعات (FIDIC)');
    expect(html).toContain('الشؤون القانونية والتعاقدية');
  });

  it('customizes Arabic title for /board route', () => {
    mockPathname = '/board';
    const mockError = new Error('Executive KPI calculation');
    const mockReset = vi.fn();

    const html = renderToString(<DashboardErrorBoundary error={mockError} reset={mockReset} />);

    expect(html).toContain('تعذر تحميل لوحة القيادة التنفيذية وحوكمة المحفظة');
    expect(html).toContain('الإدارة العليا والاستراتيجية');
  });

  it('displays error digest code if provided by Next.js', () => {
    const mockError = Object.assign(new Error('Hydration mismatch error'), {
      digest: 'PZ-ERR-99482',
    });
    const mockReset = vi.fn();

    const html = renderToString(<DashboardErrorBoundary error={mockError} reset={mockReset} />);

    expect(html).toContain('PZ-ERR-99482');
    expect(html).toContain('Ref:');
  });

  it('includes expandable technical details button for developers and support', () => {
    const mockError = new Error('Specific technical stack trace information');
    const mockReset = vi.fn();

    const html = renderToString(<DashboardErrorBoundary error={mockError} reset={mockReset} />);

    expect(html).toContain('عرض التفاصيل الفنية للدعم والمطورين / Technical Details');
  });
});
