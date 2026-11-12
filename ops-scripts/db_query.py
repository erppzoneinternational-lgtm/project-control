"""Shared helper: query the live Supabase database via Management API.

Usage:
    from db_query import q
    rows = q("SELECT 1")
Reads credentials from .env.local (SUPABASE_ACCESS_TOKEN) and pins the project ref.
"""
import json
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = "tgqpcviqmgtdddiqvqdw"


def _token():
    env_path = os.path.join(ROOT, ".env.local")
    with open(env_path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line.startswith("SUPABASE_ACCESS_TOKEN="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError("SUPABASE_ACCESS_TOKEN not found in .env.local")


def q(sql, timeout=90):
    """Run a read/write SQL statement, return parsed JSON rows or [{'error': ...}]."""
    r = subprocess.run(
        ["curl", "-s", "-X", "POST",
         f"https://api.supabase.com/v1/projects/{REF}/database/query",
         "-H", f"Authorization: Bearer {_token()}",
         "-H", "Content-Type: application/json",
         "-d", json.dumps({"query": sql})],
        capture_output=True, encoding="utf-8", errors="replace", timeout=timeout)
    try:
        out = json.loads(r.stdout)
    except Exception:
        out = [{"error": (r.stdout or r.stderr)[:500]}]
    if isinstance(out, dict):
        out = [out]
    return out


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    result = q(sys.argv[1])
    print(json.dumps(result, indent=1, ensure_ascii=False)[:4000])
