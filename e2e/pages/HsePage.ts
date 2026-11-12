import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for HSE Management (/hse)
 * Covers safety metrics, incidents register, safety audits/inspections, and electronic PTW permit-to-work flow.
 */
export class HsePage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly safeManHoursCard: Locator;
  readonly ltiFreeDaysCard: Locator;
  readonly totalIncidentsCard: Locator;
  readonly safetyScoreCard: Locator;
  readonly tabIncidents: Locator;
  readonly tabAudits: Locator;
  readonly tabPermits: Locator;
  readonly table: Locator;
  readonly permitsNotice: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.locator('h1').filter({ hasText: /الصحة والسلامة والبيئة \(HSE\)|HSE/i });
    this.safeManHoursCard = page.locator('text=ساعات العمل الآمنة');
    this.ltiFreeDaysCard = page.locator('text=أيام بدون وقت ضائع (LTI-Free)');
    this.totalIncidentsCard = page.locator('text=إجمالي الحوادث');
    this.safetyScoreCard = page.locator('text=متوسط تقييم السلامة');
    this.tabIncidents = page.getByRole('button', { name: /سجل الحوادث والملاحظات/i });
    this.tabAudits = page.getByRole('button', { name: /جولات التفتيش والسلامة/i });
    this.tabPermits = page.getByRole('button', { name: /تصاريح العمل/i });
    this.table = page.locator('table');
    this.permitsNotice = page.locator('text=قريباً - نظام تصاريح العمل الإلكترونية');
  }

  async goto() {
    await this.page.goto('/hse');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectKpisVisible() {
    await expect(this.safeManHoursCard).toBeVisible();
    await expect(this.ltiFreeDaysCard).toBeVisible();
    await expect(this.totalIncidentsCard).toBeVisible();
    await expect(this.safetyScoreCard).toBeVisible();
  }

  async switchTab(tab: 'incidents' | 'audits' | 'permits') {
    if (tab === 'incidents') {
      await this.tabIncidents.click();
    } else if (tab === 'audits') {
      await this.tabAudits.click();
    } else if (tab === 'permits') {
      await this.tabPermits.click();
    }
  }

  async expectIncidentVisible(incidentNumber: string) {
    await expect(this.page.locator(`text=${incidentNumber}`).first()).toBeVisible();
  }

  async expectInspectionVisible(inspectorName: string) {
    await expect(this.page.locator(`text=${inspectorName}`).first()).toBeVisible();
  }

  async expectPermitsNoticeVisible() {
    await expect(this.permitsNotice).toBeVisible();
  }
}
