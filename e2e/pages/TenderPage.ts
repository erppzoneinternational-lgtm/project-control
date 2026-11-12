import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Tender Management (/tender)
 * Covers tenders list, bid evaluation, award flow, and pipeline KPIs.
 */
export class TenderPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly newTenderBtn: Locator;
  readonly totalTendersCard: Locator;
  readonly activePipelineCard: Locator;
  readonly awardedValueCard: Locator;
  readonly winRateCard: Locator;
  readonly tabList: Locator;
  readonly tabEvaluation: Locator;
  readonly tabAwards: Locator;
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly statusSelect: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.locator('h1').filter({ hasText: /إدارة المناقصات|Tender Management/i });
    this.newTenderBtn = page.getByRole('button', { name: /مناقصة جديدة|New Tender/i });
    this.totalTendersCard = page.locator('text=إجمالي المناقصات').or(page.locator('text=Total Tenders'));
    this.activePipelineCard = page.locator('text=المناقصات النشطة').or(page.locator('text=Active Pipeline'));
    this.awardedValueCard = page.locator('text=قيمة الترسية').or(page.locator('text=Awarded Value'));
    this.winRateCard = page.locator('text=معدل الفوز').or(page.locator('text=Win Rate'));
    this.tabList = page.getByRole('button', { name: /قائمة المناقصات|Tenders List/i });
    this.tabEvaluation = page.getByRole('button', { name: /تقييم العروض|Bid Evaluation/i });
    this.tabAwards = page.getByRole('button', { name: /الترسية|Awards/i });
    this.searchInput = page.locator('input[placeholder*="المناقصة"], input[placeholder*="tenders"]');
    this.categorySelect = page.locator('select').first();
    this.statusSelect = page.locator('select').nth(1);
    this.table = page.locator('table');
  }

  async goto() {
    await this.page.goto('/tender');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectKpisVisible() {
    await expect(this.totalTendersCard).toBeVisible();
    await expect(this.activePipelineCard).toBeVisible();
    await expect(this.awardedValueCard).toBeVisible();
    await expect(this.winRateCard).toBeVisible();
  }

  async switchTab(tab: 'list' | 'evaluation' | 'awards') {
    if (tab === 'list') {
      await this.tabList.click();
    } else if (tab === 'evaluation') {
      await this.tabEvaluation.click();
    } else if (tab === 'awards') {
      await this.tabAwards.click();
    }
  }

  async searchTenders(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByStatus(status: string) {
    await this.statusSelect.selectOption(status);
  }

  async expectTenderVisible(tenderIdentifier: string) {
    await expect(this.page.locator(`text=${tenderIdentifier}`).first()).toBeVisible();
  }
}
