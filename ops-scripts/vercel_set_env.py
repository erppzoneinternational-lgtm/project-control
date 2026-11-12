"""Add HR DB env vars to Vercel project via REST API."""
import os, sys, json, urllib.request, urllib.error
sys.stdout.reconfigure(encoding='utf-8')

TOKEN = os.environ.get("VERCEL_TOKEN", "").strip()
if not TOKEN:
    raise SystemExit("ERROR: Missing required VERCEL_TOKEN environment variable.")

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

def api(method, path, body=None):
    url = "https://api.vercel.com" + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

# 1. Find the project
print("=== 1. Finding project ===")
status, data = api("GET", "/v9/projects?limit=20")
projects = data.get("projects", [])
project = next((p for p in projects if "pzone" in p["name"].lower()), None)

if not project:
    print("Projects found:", [p["name"] for p in projects])
    print("ERROR: pzone-portal project not found")
    sys.exit(1)

PROJECT_ID = project["id"]
TEAM_ID = project.get("accountId", "")
print(f"Found: {project['name']} (id={PROJECT_ID})")

# Helper: add or update an env var
def upsert_env(key, value, env_types=None):
    if env_types is None:
        env_types = ["production", "preview", "development"]

    # Check if it already exists
    qs = f"?projectId={PROJECT_ID}"
    if TEAM_ID:
        qs += f"&teamId={TEAM_ID}"
    status, existing = api("GET", f"/v10/projects/{PROJECT_ID}/env{qs}")
    envs = existing.get("envs", [])
    existing_var = next((e for e in envs if e["key"] == key), None)

    if existing_var:
        # Update
        env_id = existing_var["id"]
        status, result = api("PATCH", f"/v10/projects/{PROJECT_ID}/env/{env_id}",
                             {"value": value, "type": "plain", "target": env_types})
        print(f"  UPDATED {key}: status={status}")
        return result
    else:
        # Create
        status, result = api("POST", f"/v10/projects/{PROJECT_ID}/env",
                             {"key": key, "value": value, "type": "plain", "target": env_types})
        print(f"  CREATED {key}: status={status}")
        return result

# 2. Add the two HR env vars
print("\n=== 2. Adding HR DB env vars ===")
HR_URL = os.environ.get("NEXT_PUBLIC_HR_SUPABASE_URL", "https://ftmguacqywsucjhjiacn.supabase.co").strip()
HR_ANON_KEY = os.environ.get("NEXT_PUBLIC_HR_SUPABASE_ANON_KEY", "").strip()
if not HR_ANON_KEY:
    raise SystemExit("ERROR: Missing required NEXT_PUBLIC_HR_SUPABASE_ANON_KEY environment variable.")

upsert_env("NEXT_PUBLIC_HR_SUPABASE_URL", HR_URL)
upsert_env("NEXT_PUBLIC_HR_SUPABASE_ANON_KEY", HR_ANON_KEY)

# 3. Also ensure main Supabase vars are set (check only)
print("\n=== 3. Verifying all required env vars exist ===")
qs = f"?projectId={PROJECT_ID}"
status, existing = api("GET", f"/v10/projects/{PROJECT_ID}/env{qs}")
envs = existing.get("envs", [])
required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_HR_SUPABASE_URL",
    "NEXT_PUBLIC_HR_SUPABASE_ANON_KEY",
]
for key in required:
    found = next((e for e in envs if e["key"] == key), None)
    targets = found.get("target", []) if found else []
    print(f"  {'✅' if found else '❌'} {key}: {targets if found else 'MISSING'}")

# 4. Trigger a new deployment (redeploy latest)
print("\n=== 4. Triggering redeploy ===")
status, deploys = api("GET", f"/v6/deployments?projectId={PROJECT_ID}&limit=1&state=READY")
latest = deploys.get("deployments", [])
if latest:
    dep = latest[0]
    dep_url = dep.get("url", "")
    dep_id = dep.get("uid", dep.get("id", ""))
    print(f"  Latest deployment: {dep_url} (id={dep_id})")

    # Create new deployment from same git ref
    git_source = dep.get("meta", {})
    commit_sha = git_source.get("githubCommitSha", "")
    repo_slug = git_source.get("githubRepo", "")

    if commit_sha and repo_slug:
        status, redeploy = api("POST", f"/v13/deployments",
            {"name": project["name"],
             "gitSource": {
                 "type": "github",
                 "repoId": git_source.get("githubRepoId", ""),
                 "ref": git_source.get("githubCommitRef", "main"),
                 "sha": commit_sha,
             },
             "projectId": PROJECT_ID,
             "target": "production",
            })
        new_url = redeploy.get("url", "")
        print(f"  Redeploy triggered: status={status}, url={new_url}")
    else:
        print(f"  Could not auto-redeploy (no git source). Push a commit to trigger.")
else:
    print("  No existing deployments found")

print("\n✅ Done.")
