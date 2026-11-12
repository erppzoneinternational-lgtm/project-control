import json
import os
import sys
import time
import urllib.request
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ARTIFACT_DIR = r"C:\Users\Hassan\.gemini\antigravity\brain\5edd900d-a94e-4788-a598-4916e37678c3"
pdf_path = os.path.join(ARTIFACT_DIR, "PZone_Real_Projects_Portfolio_Report.pdf")
preview_png_path = os.path.join(ARTIFACT_DIR, "browser_print_preview_page.png")

def dismiss_modals(page):
    try:
        dismiss_btn = page.locator('button:has-text("فهمت، حسناً"), button[aria-label="إغلاق"]').first
        if dismiss_btn.is_visible(timeout=1000):
            dismiss_btn.click()
            page.wait_for_timeout(400)
    except Exception:
        pass

def main():
    # 1. Login to get fresh token for real Supabase data
    anon_key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', '').strip()
    test_email = os.environ.get('E2E_TEST_EMAIL', '').strip()
    test_password = os.environ.get('E2E_TEST_PASSWORD', '').strip()
    if not anon_key or not test_email or not test_password:
        raise SystemExit(
            'ERROR: Missing required NEXT_PUBLIC_SUPABASE_ANON_KEY, E2E_TEST_EMAIL, or E2E_TEST_PASSWORD environment variables.'
        )
    base = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://tgqpcviqmgtdddiqvqdw.supabase.co').strip()
    login_url = f'{base}/auth/v1/token?grant_type=password'
    login_payload = json.dumps({'email': test_email, 'password': test_password}).encode()
    req = urllib.request.Request(
        login_url,
        data=login_payload,
        headers={
            'apikey': anon_key,
            'Content-Type': 'application/json'
        }
    )
    with urllib.request.urlopen(req) as resp:
        token = json.loads(resp.read().decode())['access_token']

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

        # Intercept route to supply live DB token
        def handle_route(route):
            headers = dict(route.request.headers)
            headers["authorization"] = f"Bearer {token}"
            route.continue_(headers=headers)

        page.route("**/rest/v1/**", handle_route)

        # Hook window.open to grab the generated print HTML
        page.add_init_script("""
            window.localStorage.setItem('pzone_portal_last_seen_changelog', 'v2.8.0');
            window.localStorage.setItem('pzone_changelog_dont_show', 'true');
            window.__capturedHtml = null;

            const origOpen = window.open;
            window.open = function(url, target, features) {
                const w = origOpen.call(window, '', target, features);
                if (w) {
                    const origWrite = w.document.write;
                    w.document.write = function(str) {
                        window.__capturedHtml = str;
                        return origWrite.call(w.document, str);
                    };
                }
                return w;
            };
        """)

        print("Navigating to http://localhost:3000/projects...")
        page.goto("http://localhost:3000/projects", wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        dismiss_modals(page)

        # Wait for Custom Report Studio button
        page.wait_for_selector('[data-testid="open-custom-report-modal"]', timeout=20000)
        page.wait_for_timeout(1000)

        # Open Studio
        page.locator('[data-testid="open-custom-report-modal"]').first.click()
        page.wait_for_selector('div[role="dialog"]', timeout=10000)
        page.wait_for_timeout(1000)

        # Click Print / PDF
        print("Clicking 'معاينة وطباعة / PDF' button...")
        print_btn = page.locator('div[role="dialog"] button:has-text("معاينة وطباعة / PDF")').first
        print_btn.click()
        page.wait_for_timeout(2000)

        html = page.evaluate("window.__capturedHtml")
        if not html:
            # Fallback to check iframe if window.open wasn't used
            html = page.evaluate("""() => {
                const ifr = document.querySelector('iframe');
                return ifr && ifr.contentWindow ? ifr.contentWindow.document.documentElement.outerHTML : null;
            }""")

        if html:
            print(f"Captured HTML size: {len(html)} bytes")
            # Save HTML artifact
            html_path = os.path.join(ARTIFACT_DIR, "PZone_Real_Projects_Portfolio_Report.html")
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"Saved HTML: {html_path}")

            # Generate real PDF using Playwright print-to-pdf
            print_page = browser.new_page()
            print_page.set_content(html, wait_until="load")
            print_page.screenshot(path=preview_png_path, full_page=True)
            print(f"Saved Preview Screenshot: {preview_png_path}")

            print_page.pdf(
                path=pdf_path,
                format="A4",
                landscape=True,
                print_background=True,
                margin={"top": "8mm", "bottom": "12mm", "left": "10mm", "right": "10mm"}
            )
            print(f"SUCCESS: Real PDF generated at: {pdf_path}")
            print(f"PDF size: {os.path.getsize(pdf_path)} bytes")
        else:
            print("ERROR: Could not capture print HTML!")

        browser.close()

if __name__ == "__main__":
    main()
