import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Document Control & Engineering Drawings (/document-control)
 * Covers controlled documents, transmittals, revisions, and document status metrics.
 */
export class DocumentControlPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly addDocBtn: Locator;
  readonly newTransmittalBtn: Locator;
  readonly totalDocsCard: Locator;
  readonly approvedCard: Locator;
  readonly underReviewCard: Locator;
  readonly transmittalsCard: Locator;
  readonly tabDocs: Locator;
  readonly tabTransmittals: Locator;
  readonly tabRevisions: Locator;
  readonly searchInput: Locator;
  readonly typeFilter: Locator;
  readonly statusFilter: Locator;
  readonly table: Locator;

  // Add Document Modal Locators
  readonly addDocModal: Locator;
  readonly docNumberInput: Locator;
  readonly docRevInput: Locator;
  readonly docTitleArInput: Locator;
  readonly docTitleEnInput: Locator;
  readonly docTypeSelect: Locator;
  readonly docDisciplineSelect: Locator;
  readonly docStatusSelect: Locator;
  readonly docSubmitBtn: Locator;

  // Transmittal Modal Locators
  readonly newTransmittalModal: Locator;
  readonly trnNumberInput: Locator;
  readonly trnSenderInput: Locator;
  readonly trnRecipientInput: Locator;
  readonly trnPurposeSelect: Locator;
  readonly trnCountInput: Locator;
  readonly trnStatusSelect: Locator;
  readonly trnSubmitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.locator('h1').filter({ hasText: /إدارة الوثائق والمخططات|Document Control/i });
    this.addDocBtn = page.getByRole('button', { name: /إضافة وثيقة|Add Document/i });
    this.newTransmittalBtn = page.getByRole('button', { name: /إصدار خطاب إرسال|New Transmittal/i });
    this.totalDocsCard = page.locator('p').filter({ hasText: /^إجمالي الوثائق$|^Total Documents$/ });
    this.approvedCard = page.locator('p').filter({ hasText: /^نسبة الاعتماد$|^Approved$/ });
    this.underReviewCard = page.locator('p').filter({ hasText: /^قيد المراجعة$|^Under Review$/ });
    this.transmittalsCard = page.locator('p').filter({ hasText: /^خطابات الإرسال$|^Transmittals$/ });
    this.tabDocs = page.getByRole('button', { name: /سجل الوثائق والمخططات|Documents & Drawings/i });
    this.tabTransmittals = page.getByRole('button', { name: /خطابات الإرسال|Transmittals/i }).first();
    this.tabRevisions = page.getByRole('button', { name: /المراجعات الأخيرة|Recent Revisions/i });
    this.searchInput = page.locator('input[placeholder*="الوثيقة"], input[placeholder*="doc number"], input[placeholder*="الخطاب"]');
    this.typeFilter = page.locator('select').first();
    this.statusFilter = page.locator('select').nth(1);
    this.table = page.locator('table');

    // Add Document Modal
    this.addDocModal = page.locator('div[role="dialog"]').filter({ hasText: /إضافة وثيقة|Add New Document/i });
    this.docNumberInput = page.locator('input[placeholder="e.g. DWG-ARC-001"]');
    this.docRevInput = page.locator('input[placeholder="e.g. 00, A, 01"]');
    this.docTitleArInput = this.addDocModal.locator('input[dir="rtl"]');
    this.docTitleEnInput = this.addDocModal.locator('input[placeholder*="Architectural"]');
    this.docTypeSelect = this.addDocModal.locator('select').first();
    this.docDisciplineSelect = this.addDocModal.locator('select').nth(1);
    this.docStatusSelect = this.addDocModal.locator('select').nth(2);
    this.docSubmitBtn = this.addDocModal.getByRole('button', { name: /حفظ الوثيقة|Save Document/i });

    // Transmittal Modal
    this.newTransmittalModal = page.locator('div[role="dialog"]').filter({ hasText: /إصدار خطاب إرسال|Create Document Transmittal/i });
    this.trnNumberInput = this.newTransmittalModal.locator('input[placeholder*="TRN-"]');
    this.trnSenderInput = this.newTransmittalModal.locator('input[placeholder*="المقاول"], input[placeholder*="Sender"]');
    this.trnRecipientInput = this.newTransmittalModal.locator('input[placeholder*="استشاري"], input[placeholder*="Recipient"]');
    this.trnPurposeSelect = this.newTransmittalModal.locator('select').first();
    this.trnCountInput = this.newTransmittalModal.locator('input[type="number"]');
    this.trnStatusSelect = this.newTransmittalModal.locator('select').nth(1);
    this.trnSubmitBtn = this.newTransmittalModal.getByRole('button', { name: /إصدار الخطاب|Issue Transmittal/i });
  }

  async goto() {
    await this.page.goto('/document-control');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectKpisVisible() {
    await expect(this.totalDocsCard).toBeVisible();
    await expect(this.approvedCard).toBeVisible();
    await expect(this.underReviewCard).toBeVisible();
    await expect(this.transmittalsCard).toBeVisible();
  }

  async switchTab(tab: 'docs' | 'transmittals' | 'revisions') {
    if (tab === 'docs') {
      await this.tabDocs.click();
    } else if (tab === 'transmittals') {
      await this.tabTransmittals.click();
    } else if (tab === 'revisions') {
      await this.tabRevisions.click();
    }
  }

  async searchDocs(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
  }

  async filterByType(type: string) {
    await this.typeFilter.selectOption(type);
  }

  async expectDocumentVisible(docNumber: string) {
    await expect(this.page.locator(`text=${docNumber}`).first()).toBeVisible();
  }

  async openAddDocumentModal() {
    await this.addDocBtn.click();
    await expect(this.addDocModal).toBeVisible();
  }

  async fillAndSubmitDocument(data: {
    docNumber: string;
    revision?: string;
    titleAr: string;
    titleEn?: string;
    type?: string;
    discipline?: string;
    status?: string;
  }) {
    await this.docNumberInput.fill(data.docNumber);
    if (data.revision) {
      await this.docRevInput.fill(data.revision);
    }
    await this.docTitleArInput.fill(data.titleAr);
    if (data.titleEn) {
      await this.docTitleEnInput.fill(data.titleEn);
    }
    if (data.type) {
      await this.docTypeSelect.selectOption(data.type);
    }
    if (data.discipline) {
      await this.docDisciplineSelect.selectOption(data.discipline);
    }
    if (data.status) {
      await this.docStatusSelect.selectOption(data.status);
    }
    await this.docSubmitBtn.click();
  }

  async openNewTransmittalModal() {
    await this.switchTab('transmittals');
    await this.newTransmittalBtn.click();
    await expect(this.newTransmittalModal).toBeVisible();
  }

  async fillAndSubmitTransmittal(data: {
    transmittalNumber: string;
    sender?: string;
    recipient?: string;
    purpose?: string;
    count?: number;
    status?: string;
  }) {
    await this.trnNumberInput.fill(data.transmittalNumber);
    if (data.sender) {
      await this.trnSenderInput.fill(data.sender);
    }
    if (data.recipient) {
      await this.trnRecipientInput.fill(data.recipient);
    }
    if (data.purpose) {
      await this.trnPurposeSelect.selectOption(data.purpose);
    }
    if (data.count) {
      await this.trnCountInput.fill(String(data.count));
    }
    if (data.status) {
      await this.trnStatusSelect.selectOption(data.status);
    }
    await this.trnSubmitBtn.click();
  }

  async expectTransmittalVisible(transmittalNumber: string) {
    await expect(this.page.locator(`text=${transmittalNumber}`).first()).toBeVisible();
  }
}
