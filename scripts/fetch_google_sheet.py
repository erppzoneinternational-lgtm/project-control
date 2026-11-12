"""
Fetch Google Sheet CSV by copying cookies from user's Chrome profile.
Uses sqlite3 to read Chrome cookies, then uses them with Playwright in a fresh context.
"""
import subprocess
import sys
import os
import time
import shutil
import sqlite3
import json

SHEET_ID = "1nhaSqU_B_Gn1dg4RnMK9aDV4uAvGaJwamgjgMCYNKvU"
GID = "1550298220"
EXPORT_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}"
GVIZ_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&gid={GID}"
VIEW_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit?gid={GID}"
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "projects_live_data.csv")

def try_launch_chrome_with_cdp():
    """Launch a NEW Chrome instance with debugging port using a temp profile copy."""
    chrome_path = None
    for p in [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
    ]:
        if os.path.exists(p):
            chrome_path = p
            break
    
    if not chrome_path:
        print("Chrome not found")
        return None
    
    # Use a temp user data dir but copy key auth files
    src_profile = os.path.expandvars(r"%LocalAppData%\Google\Chrome\User Data")
    temp_profile = os.path.join(os.environ.get("TEMP", "."), "chrome_cdp_profile")
    
    # Clean up old temp profile
    if os.path.exists(temp_profile):
        try:
            shutil.rmtree(temp_profile, ignore_errors=True)
        except:
            pass
    
    os.makedirs(temp_profile, exist_ok=True)
    
    # Copy Local State (for cookie decryption key)
    local_state_src = os.path.join(src_profile, "Local State")
    if os.path.exists(local_state_src):
        shutil.copy2(local_state_src, os.path.join(temp_profile, "Local State"))
    
    # Copy Default profile cookies and login data
    default_src = os.path.join(src_profile, "Default")
    default_dst = os.path.join(temp_profile, "Default")
    os.makedirs(default_dst, exist_ok=True)
    
    for fname in ["Cookies", "Login Data", "Web Data", "Preferences", "Secure Preferences"]:
        src_file = os.path.join(default_src, fname)
        if os.path.exists(src_file):
            try:
                shutil.copy2(src_file, os.path.join(default_dst, fname))
            except Exception as e:
                print(f"  Could not copy {fname}: {e}")
    
    # Launch Chrome
    port = 9224
    proc = subprocess.Popen([
        chrome_path,
        f"--remote-debugging-port={port}",
        f"--user-data-dir={temp_profile}",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "about:blank",
    ])
    
    print(f"Chrome launched with PID {proc.pid} on port {port}")
    time.sleep(5)
    return port, proc, temp_profile

def fetch_with_playwright(port):
    """Connect to Chrome via CDP and fetch the sheet."""
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        print(f"Connecting to CDP port {port}...")
        browser = p.chromium.connect_over_cdp(f"http://localhost:{port}")
        context = browser.contexts[0] if browser.contexts else browser.new_context()
        page = context.new_page()
        
        # First navigate to Google Sheets to establish auth context
        print("Navigating to Google Sheets...")
        page.goto(VIEW_URL, wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        
        current_url = page.url
        print(f"Current URL: {current_url}")
        
        if "accounts.google.com" in current_url:
            print("Auth redirect detected - cookies not transferred. Trying fetch within page...")
        
        # Try export via fetch within authenticated context
        print("Attempting CSV export via fetch...")
        for url in [EXPORT_URL, GVIZ_URL]:
            csv_data = page.evaluate("""
                async (url) => {
                    try {
                        const resp = await fetch(url, { credentials: 'include', redirect: 'follow' });
                        if (resp.ok) {
                            const text = await resp.text();
                            return { ok: true, data: text, status: resp.status };
                        }
                        return { ok: false, status: resp.status, url: resp.url };
                    } catch (e) {
                        return { ok: false, error: e.message };
                    }
                }
            """, url)
            
            print(f"  URL: {url.split('?')[0].split('/')[-1]}")
            print(f"  Result: ok={csv_data.get('ok')}, status={csv_data.get('status')}")
            
            if csv_data.get("ok") and csv_data.get("data"):
                data = csv_data["data"]
                if len(data) > 100 and not data.startswith("<!DOCTYPE"):
                    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
                        f.write(data)
                    print(f"SUCCESS: Saved {len(data)} bytes to {OUTPUT_PATH}")
                    page.close()
                    browser.close()
                    return True
        
        # Fallback: try Playwright direct download
        print("Trying download via Playwright...")
        with page.expect_download(timeout=15000) as download_info:
            page.goto(EXPORT_URL, timeout=15000)
        download = download_info.value
        download.save_as(OUTPUT_PATH)
        print(f"SUCCESS via download: saved to {OUTPUT_PATH}")
        page.close()
        browser.close()
        return True

def fetch_with_fresh_playwright():
    """Launch fresh Chromium with Playwright, using exported cookies."""
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        # Launch fresh browser
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        # Navigate to the sheet (will redirect to Google login since no cookies)
        print("Launching fresh browser to check if sheet is actually public...")
        page.goto(VIEW_URL, wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        
        current = page.url
        print(f"URL: {current}")
        
        if "accounts.google.com" not in current:
            # Sheet might be accessible
            csv_data = page.evaluate("""
                async () => {
                    const resp = await fetch(
                        'https://docs.google.com/spreadsheets/d/1nhaSqU_B_Gn1dg4RnMK9aDV4uAvGaJwamgjgMCYNKvU/export?format=csv&gid=1550298220',
                        { credentials: 'include' }
                    );
                    return resp.ok ? await resp.text() : null;
                }
            """)
            if csv_data and len(csv_data) > 100:
                with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
                    f.write(csv_data)
                print(f"SUCCESS: {len(csv_data)} bytes saved")
                browser.close()
                return True
        
        browser.close()
        return False

def main():
    # Strategy 1: Launch Chrome with temp profile copy (has auth cookies)
    print("=== Strategy 1: Chrome + copied cookies ===")
    result = try_launch_chrome_with_cdp()
    if result:
        port, proc, temp_dir = result
        try:
            success = fetch_with_playwright(port)
            if success:
                return
        except Exception as e:
            print(f"Strategy 1 failed: {e}")
            import traceback
            traceback.print_exc()
        finally:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except:
                proc.kill()
            # Clean temp profile
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except:
                pass
    
    # Strategy 2: Use existing downloaded files
    print("\n=== Strategy 2: Check for existing downloaded data ===")
    candidates = [
        r"C:\Users\Hassan\Downloads\Projects.csv",
        r"C:\Users\Hassan\Downloads\Projects_Sheet_Sheet1.csv",
        r"C:\Users\Hassan\Downloads\Projects.xlsx",
        r"C:\Users\Hassan\Downloads\Projects (1).xlsx",
    ]
    
    for f in candidates:
        if os.path.exists(f):
            print(f"Found existing file: {f} ({os.path.getsize(f)} bytes, modified {time.ctime(os.path.getmtime(f))})")
            # Copy the best candidate
            if f.endswith('.csv'):
                shutil.copy2(f, OUTPUT_PATH)
                print(f"Copied to {OUTPUT_PATH}")
                return
    
    # If xlsx found, convert
    for f in candidates:
        if os.path.exists(f) and f.endswith('.xlsx'):
            print(f"Found XLSX: {f}")
            try:
                import openpyxl
                wb = openpyxl.load_workbook(f, read_only=True, data_only=True)
                # Use first sheet or find the right one
                print(f"Sheets: {wb.sheetnames}")
                ws = wb.active
                import csv
                with open(OUTPUT_PATH, 'w', encoding='utf-8', newline='') as csvfile:
                    writer = csv.writer(csvfile)
                    for row in ws.iter_rows(values_only=True):
                        writer.writerow(row)
                print(f"Converted XLSX -> CSV: {OUTPUT_PATH}")
                return
            except Exception as e:
                print(f"XLSX conversion failed: {e}")
    
    print("\nAll strategies failed. Need user to download CSV manually.")

if __name__ == "__main__":
    main()
