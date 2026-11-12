import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { HandoverCertificateModal } from '@/components/projects/HandoverCertificateModal';
import { Project } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    dir: 'rtl',
    t: (k: string) => k,
  }),
}));

const mockProject: Project = {
  id: 'proj-pmi-001',
  project_name: 'مشروع مجمع حمامات سباحة بالم هيلز',
  name_ar: 'مشروع مجمع حمامات سباحة بالم هيلز',
  project_code: 'PZ-PH-2026',
  status: 'handing_over',
  contract_value: 5000000,
  vos_value: 500000,
  total_contract_value: 5500000,
  site_location_address: 'مدينة 6 أكتوبر - الجيزة',
  toc_letter: 'TOC-APPROVED-2026-09',
  client: {
    id: 'client-1',
    name_ar: 'شركة بالم هيلز للتعمير',
    name_en: 'Palm Hills Developments',
  },
  metadata: {
    handover_checklist: {
      toc_received: true,
      toc_reference: 'TOC-APPROVED-2026-09',
      snag_list_completed: true,
      snag_list_type: 'minor_only',
      snag_clearance_days: 21,
      testing_commissioning_passed: true,
      as_built_submitted: true,
      om_manuals_submitted: true,
      client_training_completed: true,
      dlp_start_date: '2026-10-01',
      handover_notes: 'تم فحص منظومة الفلاتر واللوحات الكهربائية بنجاح مع اعتماد قائمة النواقص الطفيفة.',
      handover_at: '2026-10-01T10:00:00Z',
    },
  },
} as unknown as Project;

describe('HandoverCertificateModal (Official PMI/FIDIC Taking-Over Certificate)', () => {
  it('returns null when isOpen is false', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <HandoverCertificateModal
        isOpen={false}
        onClose={vi.fn()}
        project={mockProject}
      />
    );
    expect(html).toBe('');
  });

  it('renders official Taking-Over Certificate (TOC) layout when isOpen is true', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <HandoverCertificateModal
        isOpen={true}
        onClose={vi.fn()}
        project={mockProject}
      />
    );

    // Corporate Header & Branding
    expect(html).toContain('P.ZONE');
    expect(html).toContain('شركة بي زون للمنشآت المائية');
    expect(html).toContain('محضر الاستلام الابتدائي للأعمال');
    expect(html).toContain('Official Taking-Over Certificate (TOC)');
    expect(html).toContain('FIDIC Red Book Sub-Clause 10.1');

    // Project Details
    expect(html).toContain('مشروع مجمع حمامات سباحة بالم هيلز');
    expect(html).toContain('PZ-PH-2026');
    expect(html).toContain('شركة بالم هيلز للتعمير');
    expect(html).toContain('TOC-APPROVED-2026-09');
    expect(html).toContain('5,500,000');

    // PMI / FIDIC Contractual Clauses
    expect(html).toContain('Substantial Completion');
    expect(html).toContain('Testing &amp; Commissioning');
    expect(html).toContain('As-Built &amp; O&amp;M Manuals');
    expect(html).toContain('21'); // clearance days
    expect(html).toContain('365'); // DLP days

    // Tri-Party Signatures
    expect(html).toContain('عن المقاول العام (شركة بي زون)');
    expect(html).toContain('عن الاستشاري المشرف على التنفيذ');
    expect(html).toContain('عن المالك / صاحب العمل');

    // Print & Close Controls
    expect(html).toContain('طباعة / تصدير PDF');
  });

  it('renders clean fallback content when handover notes or metadata are minimal', () => {
    const minimalProject: Project = {
      id: 'proj-min-002',
      project_name: 'مشروع نادي الصيد',
      contract_value: 2000000,
      vos_value: 0,
      status: 'working',
    } as unknown as Project;

    const html = ReactDOMServer.renderToStaticMarkup(
      <HandoverCertificateModal
        isOpen={true}
        onClose={vi.fn()}
        project={minimalProject}
      />
    );

    expect(html).toContain('مشروع نادي الصيد');
    expect(html).toContain('P.ZONE');
    expect(html).toContain('2,000,000');
  });

  it('contains dedicated printable container with A4 avoid-break and print grid columns', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <HandoverCertificateModal
        isOpen={true}
        onClose={vi.fn()}
        project={mockProject}
      />
    );

    // Isolated printable container ID
    expect(html).toContain('id="handover-certificate-printable"');

    // Print columns preservation
    expect(html).toContain('print:grid-cols-4');
    expect(html).toContain('print:grid-cols-3');

    // Page-break prevention
    expect(html).toContain('avoid-break');
  });
});
