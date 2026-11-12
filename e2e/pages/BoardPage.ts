import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Board of Directors Dashboard (/board)
 * Covers executive portfolio overview, project status distribution, progress trend, and portfolio financial KPIs.
 */
export class BoardPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly boardBadge: Locator;
  readonly activeProjectsCard: Locator;
  readonly portfolioValueCard: Locator;
  readonly averageProgressCard: Locator;
  readonly outstandingClaimsCard: Locator;
  readonly statusDistributionChartHeading: Locator;
  readonly progressTrendChartHeading: Locator;
  readonly activeProjectsTableHeading: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.locator('h1').filter({ hasText: /ملخص الأداء التنفيذي للمحفظة|Executive Portfolio Overview/i });
    this.boardBadge = page.locator('text=مجلس الإدارة (Board of Directors)').or(page.locator('text=Board of Directors'));
    this.activeProjectsCard = page.locator('text=المشاريع النشطة').or(page.locator('text=Active Projects')).first();
    this.portfolioValueCard = page.locator('text=قيمة المحفظة الإجمالية').or(page.locator('text=Total Portfolio Value')).first();
    this.averageProgressCard = page.locator('text=متوسط نسبة الإنجاز').or(page.locator('text=Average Progress')).first();
    this.outstandingClaimsCard = page.locator('text=المطالبات المعلقة').or(page.locator('text=Outstanding Claims')).first();
    this.statusDistributionChartHeading = page.locator('text=توزيع حالة المشاريع').or(page.locator('text=Project Status Distribution'));
    this.progressTrendChartHeading = page.locator('text=التوجه العام لنسبة الإنجاز (شهري)').or(page.locator('text=Monthly Progress Trend'));
    this.activeProjectsTableHeading = page.locator('text=قائمة المشاريع النشطة').or(page.locator('text=Active Projects List'));
    this.table = page.locator('table');
  }

  async goto() {
    await this.page.goto('/board');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectKpisVisible() {
    await expect(this.activeProjectsCard).toBeVisible();
    await expect(this.portfolioValueCard).toBeVisible();
    await expect(this.averageProgressCard).toBeVisible();
    await expect(this.outstandingClaimsCard).toBeVisible();
  }

  async expectChartsVisible() {
    await expect(this.statusDistributionChartHeading).toBeVisible();
    await expect(this.progressTrendChartHeading).toBeVisible();
  }

  async expectProjectVisible(nameOrCode: string) {
    await expect(this.table.locator(`text=${nameOrCode}`).first()).toBeVisible();
  }
}
