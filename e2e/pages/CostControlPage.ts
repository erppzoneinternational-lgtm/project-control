import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Cost Control & EVM Dashboard (e2e-testing-patterns)
 * Covers EVM snapshots, on-demand recalculation trigger, and financial KPI metrics.
 */
export class CostControlPage {
  readonly page: Page;
  readonly recalculateBtn: Locator;
  readonly pageHeading: Locator;
  readonly totalBudgetCard: Locator;
  readonly actualCostCard: Locator;
  readonly earnedValueCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.recalculateBtn = page.getByTestId('recalculate-evm-btn');
    this.pageHeading = page.locator('text=التحكم بالتكاليف وإدارة القيمة المكتسبة (EVM)');
    this.totalBudgetCard = page.getByRole('paragraph').filter({ hasText: 'الميزانية الإجمالية (BAC)' });
    this.actualCostCard = page.getByRole('paragraph').filter({ hasText: 'التكلفة الفعلية (AC)' });
    this.earnedValueCard = page.getByRole('paragraph').filter({ hasText: 'القيمة المكتسبة (EV)' });
  }

  async goto() {
    await this.page.goto('/cost-control');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async triggerRecalculate() {
    await expect(this.recalculateBtn).toBeVisible();
    await this.recalculateBtn.click();
  }

  async expectKpisVisible() {
    await expect(this.totalBudgetCard).toBeVisible();
    await expect(this.actualCostCard).toBeVisible();
    await expect(this.earnedValueCard).toBeVisible();
  }
}
