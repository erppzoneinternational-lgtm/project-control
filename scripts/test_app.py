import time
from playwright.sync_api import sync_playwright

def run():
    print("Starting E2E Playwright verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        
        try:
            # 1. Open Projects List Page
            print("1. Testing Projects List (http://localhost:3000/projects) ...")
            response = page.goto("http://localhost:3000/projects", wait_until="domcontentloaded", timeout=20000)
            print(f"   Status: {response.status}")
            page.wait_for_timeout(3000)
            page.screenshot(path="C:/Users/Hassan/.gemini/antigravity/brain/5a358c9b-9548-4bfa-afb8-64f5a64f18ec/projects_list.png")
            
            # 2. Open Analytics Dashboard Page
            print("2. Testing Analytics Dashboard (http://localhost:3000/projects/dashboard) ...")
            response = page.goto("http://localhost:3000/projects/dashboard", wait_until="domcontentloaded", timeout=20000)
            print(f"   Status: {response.status}")
            page.wait_for_timeout(3000)
            page.screenshot(path="C:/Users/Hassan/.gemini/antigravity/brain/5a358c9b-9548-4bfa-afb8-64f5a64f18ec/analytics_dashboard.png")

            # 3. Open Project Details Page
            print("3. Testing Project Details (http://localhost:3000/projects/2a61819e-0924-403c-9144-a9158afffe77) ...")
            response = page.goto("http://localhost:3000/projects/2a61819e-0924-403c-9144-a9158afffe77", wait_until="domcontentloaded", timeout=20000)
            print(f"   Status: {response.status}")
            page.wait_for_timeout(3000)
            page.screenshot(path="C:/Users/Hassan/.gemini/antigravity/brain/5a358c9b-9548-4bfa-afb8-64f5a64f18ec/project_detail.png")

            # 4. Open User Management
            print("4. Testing User Management (http://localhost:3000/user-management) ...")
            response = page.goto("http://localhost:3000/user-management", wait_until="domcontentloaded", timeout=20000)
            print(f"   Status: {response.status}")
            page.wait_for_timeout(3000)
            page.screenshot(path="C:/Users/Hassan/.gemini/antigravity/brain/5a358c9b-9548-4bfa-afb8-64f5a64f18ec/user_management.png")
            
            print("\nVerification Complete!")
            print("Total Console Errors:", len(console_errors))
            if console_errors:
                print("Console Error Samples:", console_errors[:3])
        except Exception as e:
            print("Error during test execution:", e)
        finally:
            browser.close()

if __name__ == "__main__":
    run()
