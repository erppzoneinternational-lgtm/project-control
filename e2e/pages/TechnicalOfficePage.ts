import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Technical Office Module:
 * - Technical Office Manager Dashboard (/to-dashboard)
 * - Technical Office Engineer Workspace (/to-tasks)
 * - Technical Office Enterprise Portal (/technical-office)
 */
export class TechnicalOfficePage {
  readonly page: Page;

  // --- /to-dashboard Locators (TO Manager Hub) ---
  readonly dashboardHeading: Locator;
  readonly managerHubBadge: Locator;
  readonly totalDeliverablesCard: Locator;
  readonly inProgressDeliverablesCard: Locator;
  readonly blockedDeliverablesCard: Locator;
  readonly approvedDeliverablesCard: Locator;
  readonly dashboardProjectSelect: Locator;
  readonly dashboardRefreshBtn: Locator;

  // Tabs
  readonly tabApprovals: Locator;
  readonly tabAssignments: Locator;
  readonly tabKpis: Locator;

  // Approval Queue
  readonly approvalSearchInput: Locator;
  readonly approveProgressBtn: Locator;
  readonly rejectProgressBtn: Locator;
  readonly reassignBtn: Locator;

  // --- /to-tasks Locators (TO Engineer Workspace) ---
  readonly tasksHeading: Locator;
  readonly engineerWorkspaceBadge: Locator;
  readonly tasksTotalCard: Locator;
  readonly tasksInProgressCard: Locator;
  readonly tasksBlockedCard: Locator;
  readonly tasksSearchInput: Locator;
  readonly tasksStatusFilter: Locator;
  readonly tasksCodeFilter: Locator;
  readonly logDailyProgressBtn: Locator;
  readonly reportBlockerBtn: Locator;

  // --- /technical-office Locators (Portal) ---
  readonly portalHeading: Locator;
  readonly deliverablesLink: Locator;
  readonly executiveOverviewLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // TO Dashboard
    this.dashboardHeading = page
      .locator('h1')
      .filter({ hasText: /إدارة واعتماد تسليمات ومخططات المكتب الفني|Technical Office Deliverables & Approvals/i });
    this.managerHubBadge = page
      .locator('text=مركز قيادة مدير المكتب الفني')
      .or(page.locator('text=Technical Office Manager Hub'));
    this.totalDeliverablesCard = page
      .locator('span')
      .filter({ hasText: /^إجمالي التسليمات المسجلة$|^Total Deliverables$/ })
      .first();
    this.inProgressDeliverablesCard = page
      .locator('span')
      .filter({ hasText: /^لوحات قيد الإعداد$|^In Progress Submittals$/ })
      .first();
    this.blockedDeliverablesCard = page
      .locator('span')
      .filter({ hasText: /^تسليمات معطلة \/ متأخرة$|^Blocked Deliverables$/ })
      .first();
    this.approvedDeliverablesCard = page
      .locator('span')
      .filter({ hasText: /^معتمد استشاري \(Code A\/B\)$|^Approved \(Code A\/B\)$/ })
      .first();
    this.dashboardProjectSelect = page.locator('select').first();
    this.dashboardRefreshBtn = page.getByRole('button', { name: /تحديث|Refresh/i }).first();

    // Tabs
    this.tabApprovals = page.getByRole('button', {
      name: /طابور اعتماد التقارير اليومية|Daily Approval Queue/i,
    });
    this.tabAssignments = page.getByRole('button', {
      name: /لوحة توزيع المهام واللوحات|Workload & Assignments/i,
    });
    this.tabKpis = page.getByRole('button', {
      name: /تقييم أداء مهندسي المكتب الفني|Engineer Performance KPIs/i,
    });

    // Approval Queue controls
    this.approvalSearchInput = page.locator(
      'input[placeholder*="بحث برقم المخطط"], input[placeholder*="Search by sheet"]'
    );
    this.approveProgressBtn = page
      .getByRole('button', { name: /اعتماد التقرير|Approve Progress/i })
      .first();
    this.rejectProgressBtn = page
      .getByRole('button', { name: /طلب تعديل \/ رفض|Reject \/ Revise/i })
      .first();
    this.reassignBtn = page
      .getByRole('button', { name: /إعادة تعيين لمهندس آخر|Reassign Item/i })
      .first();

    // TO Tasks
    this.tasksHeading = page
      .locator('h1')
      .filter({ hasText: /مهامي الهندسية ولوحات الشوب دروينج|My Engineering Tasks & Deliverables/i });
    this.engineerWorkspaceBadge = page
      .locator('text=مساحة عمل مهندس المكتب الفني')
      .or(page.locator('text=Technical Office Engineer Workspace'));
    this.tasksTotalCard = page
      .locator('span')
      .filter({ hasText: /^إجمالي المخططات$|^Total Assigned$/ })
      .first();
    this.tasksInProgressCard = page
      .locator('span')
      .filter({ hasText: /^قيد العمل$|^In Progress$/ })
      .first();
    this.tasksBlockedCard = page
      .locator('span')
      .filter({ hasText: /^معطل بعائق$|^Blocked$/ })
      .first();
    this.tasksSearchInput = page.locator(
      'input[placeholder*="بحث برقم اللوحة"], input[placeholder*="Search by sheet number"]'
    );
    this.tasksStatusFilter = page.locator('select').nth(1);
    this.tasksCodeFilter = page.locator('select').nth(2);
    this.logDailyProgressBtn = page
      .getByRole('button', { name: /تسجيل إنجاز اليوم|Log Daily Progress/i })
      .first();
    this.reportBlockerBtn = page
      .getByRole('button', { name: /إبلاغ عن عائق|Report Blocker/i })
      .first();

    // Portal
    this.portalHeading = page
      .locator('h1')
      .filter({ hasText: /بوابة المكتب الفني|Technical Office Portal/i });
    this.deliverablesLink = page
      .locator('a[href="/deliverables"]')
      .filter({ hasText: /متابعة التسليمات E1 \/ E2|Deliverables Log/i });
    this.executiveOverviewLink = page
      .locator('a[href="/coo/deliverables"]')
      .filter({ hasText: /متابعة تسليمات الإدارة العليا|COO Executive Overview/i });
  }

  async gotoDashboard() {
    await this.page.goto('/to-dashboard');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoTasks() {
    await this.page.goto('/to-tasks');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoPortal() {
    await this.page.goto('/technical-office');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectDashboardKpisVisible() {
    await expect(this.totalDeliverablesCard).toBeVisible();
    await expect(this.inProgressDeliverablesCard).toBeVisible();
    await expect(this.blockedDeliverablesCard).toBeVisible();
    await expect(this.approvedDeliverablesCard).toBeVisible();
  }

  async expectTasksKpisVisible() {
    await expect(this.tasksTotalCard).toBeVisible();
    await expect(this.tasksInProgressCard).toBeVisible();
    await expect(this.tasksBlockedCard).toBeVisible();
  }

  async switchTab(tab: 'approvals' | 'assignments' | 'kpis') {
    if (tab === 'approvals') {
      await this.tabApprovals.click();
    } else if (tab === 'assignments') {
      await this.tabAssignments.click();
    } else if (tab === 'kpis') {
      await this.tabKpis.click();
    }
  }

  async searchApprovalQueue(term: string) {
    await this.approvalSearchInput.fill(term);
  }

  async searchTasks(term: string) {
    await this.tasksSearchInput.fill(term);
  }

  async expectItemVisible(sheetNumberOrDesc: string) {
    await expect(this.page.locator(`text=${sheetNumberOrDesc}`).first()).toBeVisible();
  }
}
