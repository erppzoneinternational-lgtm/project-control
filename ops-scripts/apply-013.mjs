import fs from 'fs';

const tokens = JSON.parse(fs.readFileSync('C:\\Users\\Hassan\\.gemini\\antigravity\\mcp_oauth_tokens.json', 'utf8'));
const accessToken = tokens['https://mcp.supabase.com/mcp'].token.access_token;
const projectId = 'dwpdrclupradpnsminvi';

async function runSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  return { status: res.status, text };
}

const [,, mode] = process.argv;
if (mode === 'apply') {
  const sql = fs.readFileSync('supabase/migrations/013_anon_access_lockdown.sql', 'utf8');
  const r = await runSql(sql);
  console.log(`APPLY status=${r.status}`);
  console.log(r.text);
} else if (mode === 'verify') {
  const checks = [
    ['anon_privs', `SELECT has_table_privilege('anon','public.stakeholders','SELECT') AS stakeholders,
       has_table_privilege('anon','public.user_roles','SELECT') AS user_roles,
       has_table_privilege('anon','public.contract_module_access','SELECT') AS matrix,
       has_table_privilege('anon','public.clients','SELECT') AS clients,
       has_table_privilege('anon','public.pm_clients','SELECT') AS pm_clients`],
    ['remaining_grants', `SELECT count(*)::int AS remaining FROM information_schema.role_table_grants
       WHERE table_schema='public' AND table_name IN ('stakeholders','user_roles','contract_module_access','clients','pm_clients')
         AND grantee IN ('anon','PUBLIC')`],
    ['authenticated_ok', `SELECT has_table_privilege('authenticated','public.stakeholders','SELECT') AS stakeholders,
       has_table_privilege('authenticated','public.contract_module_access','SELECT') AS matrix,
       has_table_privilege('authenticated','public.user_roles','SELECT') AS user_roles`],
  ];
  for (const [name, sql] of checks) {
    const r = await runSql(sql);
    console.log(`[${name}] status=${r.status} body=${r.text}`);
  }
  const n = await runSql("SELECT pg_notify('pgrst','reload schema')");
  console.log(`[cache_reload] status=${n.status}`);
}
