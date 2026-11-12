import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { GuidedTour, TourStep } from '../GuidedTour';

describe('GuidedTour — Dynamic Spotlight Tour Component', () => {
  const sampleSteps: TourStep[] = [
    {
      targetId: 'tour-sample-btn',
      titleAr: 'زر فحص البيانات',
      titleEn: 'Data Inspection Button',
      descAr: 'هذا الزر يقوم بفحص ومزامنة البيانات الحية في المشروع.',
      descEn: 'This button inspects and synchronizes live project data.',
      tipAr: 'يمكنك استخدامه في أي وقت لتحديث الرسوم.',
      tipEn: 'Can be used anytime to refresh charts.',
      position: 'bottom',
    },
    {
      targetId: 'tour-lang-btn',
      titleAr: 'زر تغيير اللغة',
      titleEn: 'Language Switcher',
      descAr: 'تبديل لغة الواجهة بين العربية والإنجليزية.',
      descEn: 'Switch interface language between Arabic and English.',
      position: 'bottom',
    },
  ];

  it('renders nothing when isActive is false', () => {
    const html = ReactDOMServer.renderToString(
      <GuidedTour
        steps={sampleSteps}
        isActive={false}
        onClose={vi.fn()}
        isAr={true}
      />
    );
    expect(html).toBe('');
  });

  it('renders step title, description, and step tracker when isActive is true', () => {
    const html = ReactDOMServer.renderToString(
      <GuidedTour
        steps={sampleSteps}
        isActive={true}
        onClose={vi.fn()}
        isAr={true}
      />
    );

    expect(html).toContain('زر فحص البيانات');
    expect(html).toContain('هذا الزر يقوم بفحص ومزامنة البيانات الحية في المشروع');
    expect(html).toContain('يمكنك استخدامه في أي وقت لتحديث الرسوم');
    expect(html).toContain('1 من 2');
    expect(html).toContain('التالي');
  });

  it('renders English bilingual content when isAr is false', () => {
    const html = ReactDOMServer.renderToString(
      <GuidedTour
        steps={sampleSteps}
        isActive={true}
        onClose={vi.fn()}
        isAr={false}
      />
    );

    expect(html).toContain('Data Inspection Button');
    expect(html).toContain('This button inspects and synchronizes live project data.');
    expect(html).toContain('Step 1 of 2');
    expect(html).toContain('Next');
  });

  it('renders fallback dialog with dialog role and proper accessibility attributes', () => {
    const html = ReactDOMServer.renderToString(
      <GuidedTour
        steps={sampleSteps}
        isActive={true}
        onClose={vi.fn()}
        isAr={true}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="زر فحص البيانات"');
    expect(html).toContain('aria-labelledby="tour-step-title"');
    expect(html).toContain('aria-describedby="tour-step-desc"');
  });

  it('meets WCAG 2.2 AA touch target standards (>= 44px) for interactive buttons', () => {
    const html = ReactDOMServer.renderToString(
      <GuidedTour
        steps={sampleSteps}
        isActive={true}
        onClose={vi.fn()}
        isAr={true}
      />
    );

    // Validate min-h-[44px] on interactive action buttons
    expect(html).toContain('min-h-[44px]');
    expect(html).toContain('min-w-[44px]');
    expect(html).toContain('aria-label="إغلاق الجولة الإرشادية"');
  });

  it('renders flex structure with scrollable body and pinned footer for small laptop screens', () => {
    const html = ReactDOMServer.renderToString(
      <GuidedTour
        steps={sampleSteps}
        isActive={true}
        onClose={vi.fn()}
        isAr={true}
      />
    );

    // Tooltip card flex container with max height clamping
    expect(html).toContain('max-h-[min(540px,calc(100vh-32px))]');
    expect(html).toContain('overflow-y-auto');
    expect(html).toContain('flex flex-col');
  });

  it('supports dynamic theme adaptation with light and dark mode styling', () => {
    const html = ReactDOMServer.renderToString(
      <GuidedTour
        steps={sampleSteps}
        isActive={true}
        onClose={vi.fn()}
        isAr={true}
      />
    );

    // Light mode base classes with dark mode overrides
    expect(html).toContain('bg-white/95');
    expect(html).toContain('dark:bg-slate-900/98');
    expect(html).toContain('text-slate-900');
    expect(html).toContain('dark:text-slate-100');
    expect(html).toContain('border-slate-200');
    expect(html).toContain('dark:border-emerald-500/50');
  });
});
