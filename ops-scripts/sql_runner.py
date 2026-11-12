"""Statement-splitting + execution helpers for applying migrations to live Supabase.

Splits a .sql file into individual statements respecting:
  - $$ ... $$ and $tag$ ... $tag$ dollar-quoted bodies
  - ' ... ' single-quoted strings
  - -- line comments and /* block */ comments

Usage (from ops-scripts/):
    from sql_runner import split_sql, exec_file
    results = exec_file(path)   # -> [(stmt_no, sql, rows_or_error), ...]
"""
import json
import re
from db_query import q


def split_sql(text):
    """Split SQL text into statements on ';' boundaries outside quotes/comments."""
    stmts = []
    buf = []
    i, n = 0, len(text)
    depth_dollar = None  # current dollar-quote tag or None
    while i < n:
        ch = text[i]
        nxt = text[i + 1] if i + 1 < n else ""
        # dollar quote start
        if depth_dollar is None and ch == "$":
            m = re.match(r"\$([A-Za-z_][A-Za-z0-9_]*)?\$", text[i:])
            if m:
                depth_dollar = m.group(0)
                buf.append(m.group(0))
                i += len(m.group(0))
                continue
        if depth_dollar is not None:
            if text.startswith(depth_dollar, i):
                buf.append(depth_dollar)
                i += len(depth_dollar)
                depth_dollar = None
                continue
            buf.append(ch)
            i += 1
            continue
        # line comment
        if ch == "-" and nxt == "-":
            j = text.find("\n", i)
            if j == -1:
                j = n
            buf.append(text[i:j])
            i = j
            continue
        # block comment
        if ch == "/" and nxt == "*":
            j = text.find("*/", i)
            j = n if j == -1 else j + 2
            buf.append(text[i:j])
            i = j
            continue
        # single-quoted string (with '' escape)
        if ch == "'":
            buf.append(ch)
            i += 1
            while i < n:
                if text[i] == "'":
                    if i + 1 < n and text[i + 1] == "'":
                        buf.append("''")
                        i += 2
                        continue
                    buf.append("'")
                    i += 1
                    break
                buf.append(text[i])
                i += 1
            continue
        # double-quoted identifier
        if ch == '"':
            j = text.find('"', i + 1)
            j = n if j == -1 else j + 1
            buf.append(text[i:j])
            i = j
            continue
        if ch == ";":
            s = "".join(buf).strip()
            if s:
                stmts.append(s)
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    s = "".join(buf).strip()
    if s:
        stmts.append(s)
    return stmts


def _is_empty(stmt):
    """True if statement is only comments/whitespace."""
    t = re.sub(r"--[^\n]*", "", stmt)
    t = re.sub(r"/\*.*?\*/", "", t, flags=re.S)
    return t.strip() == ""


def strip_txn_wrappers(stmts):
    """Drop bare BEGIN/COMMIT/START TRANSACTION statements (we control txn per-statement)."""
    out = []
    for st in stmts:
        body = re.sub(r"--[^\n]*", "", st).strip().rstrip(";").strip().lower()
        if body in ("begin", "commit", "start transaction", "rollback"):
            continue
        out.append(st)
    return out


def _err_in(rows):
    """Detect Management-API error shapes: {'error': ...} or {'message': 'Failed to run sql query: ...'}."""
    if not isinstance(rows, list):
        return None
    for r in rows:
        if isinstance(r, dict):
            if "error" in r and len(r) <= 2:
                return str(r["error"])
            msg = r.get("message", "")
            if isinstance(msg, str) and ("Failed to run sql" in msg or "ERROR:" in msg):
                return msg
            if "hint" in r and "detail" in r and "message" in r:
                return json.dumps(r)
    return None


def run_statement(sql):
    """Execute one statement; returns dict with ok/error/rows."""
    try:
        rows = q(sql)
    except Exception as e:  # network etc.
        return {"ok": False, "error": repr(e), "rows": None}
    err = _err_in(rows)
    if err:
        return {"ok": False, "error": err, "rows": None}
    if rows == [] :
        # empty result set can mean success (DDL) - keep ok
        pass
    return {"ok": True, "error": None, "rows": rows}


def exec_file(path, log=print):
    """Split file into statements, execute each, print progress. Returns list of results."""
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    stmts = [s for s in split_sql(text) if not _is_empty(s)]
    stmts = strip_txn_wrappers(stmts)
    results = []
    for idx, st in enumerate(stmts, 1):
        head = " ".join(st.split())[:110]
        res = run_statement(st)
        status = "OK " if res["ok"] else "ERR"
        log(f"[{idx}/{len(stmts)}] {status} {head}")
        if not res["ok"]:
            log(f"      ERROR: {res['error'][:400]}")
        results.append({"no": idx, "sql": st, "ok": res["ok"], "error": res["error"]})
    return results


if __name__ == "__main__":
    import sys
    res = exec_file(sys.argv[1])
    fails = [r for r in res if not r["ok"]]
    print(f"\n== {len(res)} statements, {len(fails)} failed ==")
    for f in fails:
        print(f"--- FAILED #{f['no']} ---")
        print(f["sql"][:1500])
        print("ERROR:", (f["error"] or "")[:600])
