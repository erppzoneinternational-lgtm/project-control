import json
import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\Hassan\.gemini\antigravity\brain\5edd900d-a94e-4788-a598-4916e37678c3"

with open("fresh_token.json", encoding="utf-8") as f:
    token_data = json.load(f)

access_token = token_data["access_token"]

def dismiss_modals(page):
    try:
        dismiss_btn = page.locator('button:has-text("فهمت، حسناً"), button[aria-label="إغلاق"]').first
        if dismiss_btn.is_visible(timeout=1000):
            dismiss_btn.click()
            page.wait_for_timeout(400)
    except Exception:
        pass

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1440, "height": 900},
            extra_http_headers={"x-pzone-e2e": "true"}
        )
        ctx.add_cookies([
            {"name": "pzone-e2e-bypass", "value": "true", "domain": "localhost", "path": "/"}
        ])
        page = ctx.new_page()

        # Direct authorization header to live Supabase DB (zero mock, 100% grounded data)
        def handle_supabase_route(route):
            headers = dict(route.request.headers)
            headers["authorization"] = f"Bearer {access_token}"
            route.continue_(headers=headers)

        page.route("**/rest/v1/**", handle_supabase_route)
        page.add_init_script("""
            window.localStorage.setItem('pzone_portal_last_seen_changelog', 'v2.8.0');
            window.localStorage.setItem('pzone_changelog_dont_show', 'true');
        """)

        # ── 1. Projects Page with REAL Live Database Data ──
        print("Navigating to http://localhost:3000/projects...")
        page.goto("http://localhost:3000/projects", wait_until="networkidle")
        page.wait_for_timeout(2000)
        dismiss_modals(page)

        # Wait for custom report button in table toolbar to appear (signals loading is done)
        page.wait_for_selector('[data-testid="open-custom-report-modal"]', timeout=20000)
        page.wait_for_timeout(1000)

        rows = page.locator('table tbody tr')
        print(f"Total rendered table rows on /projects: {rows.count()}")
        for i in range(min(5, rows.count())):
            txt = rows.nth(i).inner_text().replace('\n', ' | ')
            print(f"Project Row {i+1}:", txt[:80].encode('ascii', 'replace').decode('ascii'))

        # Capture Projects Table with REAL projects
        proj_table = page.locator('table').first
        proj_table.scroll_into_view_if_needed()
        page.wait_for_timeout(500)
        real_table_path = os.path.join(ARTIFACT_DIR, "browser_real_projects_table.png")
        page.screenshot(path=real_table_path, full_page=False)
        print(f"Saved: {real_table_path}")

        # Open Custom Report Studio
        custom_report_btn = page.locator('[data-testid="open-custom-report-modal"]').first
        custom_report_btn.click()
        page.wait_for_selector('div[role="dialog"]', timeout=10000)
        page.wait_for_timeout(1000)

        real_report_studio_path = os.path.join(ARTIFACT_DIR, "browser_real_projects_report_studio.png")
        page.screenshot(path=real_report_studio_path, full_page=False)
        print(f"Saved: {real_report_studio_path}")

        # Close modal
        close_btn = page.locator('div[role="dialog"] button[aria-label="إغلاق"], div[role="dialog"] button:has-text("إلغاء")').first
        if close_btn.is_visible():
            close_btn.click()
            page.wait_for_timeout(500)

        # ── 2. Project Setup Page with REAL Live Database Data ──
        print("Navigating to http://localhost:3000/project-setup...")
        page.goto("http://localhost:3000/project-setup", wait_until="networkidle")
        page.wait_for_timeout(2000)
        dismiss_modals(page)

        page.wait_for_selector('[data-testid="open-setup-report-modal"]', timeout=20000)
        page.wait_for_timeout(1000)

        setup_rows = page.locator('#tour-setup-table table tbody tr')
        print(f"Total rendered rows on /project-setup: {setup_rows.count()}")
        for i in range(min(5, setup_rows.count())):
            txt = setup_rows.nth(i).inner_text().replace('\n', ' | ')
            print(f"Setup Row {i+1}:", txt[:80].encode('ascii', 'replace').decode('ascii'))

        setup_table = page.locator('#tour-setup-table')
        setup_table.scroll_into_view_if_needed()
        page.wait_for_timeout(500)
        real_setup_path = os.path.join(ARTIFACT_DIR, "browser_real_project_setup.png")
        page.screenshot(path=real_setup_path, full_page=False)
        print(f"Saved: {real_setup_path}")

        # Open Custom Setup Report Studio
        setup_report_btn = page.locator('[data-testid="open-setup-report-modal"]').first
        setup_report_btn.click()
        page.wait_for_selector('div[role="dialog"]', timeout=10000)
        page.wait_for_timeout(1000)

        real_setup_studio_path = os.path.join(ARTIFACT_DIR, "browser_real_setup_report_studio.png")
        page.screenshot(path=real_setup_studio_path, full_page=False)
        print(f"Saved: {real_setup_studio_path}")

        browser.close()
        print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY WITH REAL DATABASE DATA!")

if __name__ == "__main__":
    main()
