import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Site Workspace (e2e-testing-patterns)
 * Covers field engineer cockpit, contextual dials, and obstruction modal flows.
 */
export class SiteWorkspacePage {
  readonly page: Page;
  readonly quickDialWir: Locator;
  readonly quickDialObstruction: Locator;
  readonly quickDialBoq: Locator;
  readonly quickDialClaims: Locator;
  readonly obstructionModal: Locator;
  readonly criticalPathToggle: Locator;
  readonly eotDaysInput: Locator;
  readonly descriptionInput: Locator;
  readonly submitObstructionBtn: Locator;
  readonly cancelObstructionBtn: Locator;
  readonly siteConditionsCard: Locator;
  readonly siteResourcesCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.quickDialWir = page.getByTestId('quick-dial-wir');
    this.quickDialObstruction = page.getByTestId('quick-dial-obstruction');
    this.quickDialBoq = page.getByTestId('quick-dial-boq');
    this.quickDialClaims = page.getByTestId('quick-dial-claims');
    this.obstructionModal = page.locator('.fixed.inset-0').filter({ hasText: 'تسجيل إعاقة' });
    this.criticalPathToggle = page.getByTestId('critical-path-toggle');
    this.eotDaysInput = page.getByTestId('eot-days-input');
    this.descriptionInput = page.getByTestId('obstruction-description-input');
    this.submitObstructionBtn = page.getByTestId('submit-obstruction-btn');
    this.cancelObstructionBtn = page.getByTestId('cancel-btn');
    this.siteConditionsCard = page.locator('text=أحوال الموقع (اليوم)');
    this.siteResourcesCard = page.locator('text=الموارد الحالية (اليوم)');
  }

  async goto() {
    await this.page.goto('/site-workspace');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openObstructionModal() {
    await expect(this.quickDialObstruction).toBeVisible();
    await this.quickDialObstruction.click();
    await expect(this.descriptionInput).toBeVisible();
  }

  async fillObstruction(data: {
    description: string;
    criticalPath?: boolean;
    eotDays?: number;
  }) {
    await this.descriptionInput.fill(data.description);
    if (data.criticalPath) {
      await this.criticalPathToggle.check();
      if (data.eotDays !== undefined) {
        await this.eotDaysInput.fill(data.eotDays.toString());
      }
    }
  }

  async closeObstructionModal() {
    await this.cancelObstructionBtn.click();
    await expect(this.descriptionInput).not.toBeVisible();
  }
}
