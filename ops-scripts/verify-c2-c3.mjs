#!/usr/bin/env node
/**
 * Post-deployment verification for QA fixes C2 + C3.
 * Run AFTER applying 013_anon_access_lockdown.sql and 014_contract_module_access_admin_rls.sql.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *   VERIFY_ADMIN_EMAIL=... VERIFY_ADMIN_PASS=... \
 *   VERIFY_USER_EMAIL=... VERIFY_USER_PASS=... \
 *   node ops-scripts/verify-c2-c3.mjs
 *
 * No credentials are hardcoded. Exits non-zero on any failure.
 */

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.VERIFY_ADMIN_EMAIL;
const ADMIN_PASS = process.env.VERIFY_ADMIN_PASS;
const USER_EMAIL = process.env.VERIFY_USER_EMAIL;
const USER_PASS = process.env.VERIFY_USER_PASS;

if (!URL_BASE || !ANON || !ADMIN_EMAIL || !ADMIN_PASS || !USER_EMAIL || !USER_PASS) {
  console.error('Missing required env vars. See header of this file.');
  process.exit(2);
}

let failures = 0;
function check(name, cond, detail = '') {
  const ok = cond ? 'PASS' : 'FAIL';
  if (!cond) failures++;
  console.log(`[${ok}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function rest(method, table, { asToken, query = '', body } = {}) {
  const headers = { apikey: ANON, 'Content-Type': 'application/json' };
  if (asToken) headers.Authorization = `Bearer ${asToken}`;
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?${query}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}

async function login(email, password) {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login failed for ${email}: HTTP ${res.status}`);
  return (await res.json()).access_token;
}

(async () => {
  // ---- C3: anon must be blocked everywhere ----
  for (const t of ['stakeholders', 'user_roles', 'contract_module_access', 'clients', 'pm_clients']) {
    const r = await rest('GET', t);
    check(`C3 anon blocked on ${t}`, r.status >= 400, `HTTP ${r.status}`);
  }

  // ---- C3: legitimate authenticated read still works ----
  const userTok = await login(USER_EMAIL, USER_PASS);
  const rr = await rest('GET', 'user_roles?select=role&limit=1', { asToken: userTok });
  check('C3 authenticated can still read user_roles', rr.status === 200, `HTTP ${rr.status}`);

  // ---- C2: non-admin cannot modify matrix ----
  const atk = await rest('PATCH', 'contract_module_access',
    { asToken: userTok, query: 'module_path=eq./inventory', body: { allowed_roles: ['admin'] } });
  check('C2 non-admin matrix write denied', atk.status === 403, `HTTP ${atk.status} (want 403)`);

  // ---- C2: admin CAN still edit (no-op write of current value) ----
  const adminTok = await login(ADMIN_EMAIL, ADMIN_PASS);
  const cur = await rest('GET', 'contract_module_access?module_path=eq./inventory&select=allowed_roles', { asToken: adminTok });
  check('C2 admin reads matrix', cur.status === 200 && Array.isArray(cur.json), `HTTP ${cur.status}`);
  const original = cur.json?.[0]?.allowed_roles;
  if (!original) {
    check('C2 admin no-op write', false, 'could not fetch current /inventory row');
  } else {
    const wr = await rest('PATCH', 'contract_module_access',
      { asToken: adminTok, query: 'module_path=eq./inventory', body: { allowed_roles: original } });
    check('C2 admin matrix write allowed', wr.status === 200, `HTTP ${wr.status}`);
    const after = await rest('GET', 'contract_module_access?module_path=eq./inventory&select=allowed_roles', { asToken: adminTok });
    check('C2 matrix value unchanged (no-op verified)',
      JSON.stringify(after.json?.[0]?.allowed_roles) === JSON.stringify(original));
  }

  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(2); });
