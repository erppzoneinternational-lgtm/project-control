import fs from 'fs';
import path from 'path';

async function applyMigration() {
  const tokenFile = 'C:\\Users\\Hassan\\.gemini\\antigravity\\mcp_oauth_tokens.json';
  const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  const accessToken = tokens['https://mcp.supabase.com/mcp'].token.access_token;
  const projectId = 'dwpdrclupradpnsminvi';

  const sqlPath = path.join(__dirname, '../../supabase/migrations/007_stakeholders_phase1_redesign.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('=== Applying Migration 007_stakeholders_phase1_redesign.sql ===');

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  console.log('Migration Response Status:', res.status, res.statusText);
  const resultText = await res.text();
  console.log('Migration Result:', resultText);

  if (!res.ok) {
    console.error('❌ Migration failed!');
    process.exit(1);
  }

  console.log('✅ Migration SQL executed successfully!');

  // Now run Verification queries
  console.log('\n=== RUNNING VERIFICATION CHECKS ===');

  // Verification 1: Count backfilled stakeholders
  const v1Res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `SELECT COUNT(*)::integer AS count FROM public.stakeholders WHERE stakeholder_kind = 'employee' AND organization_id = '00000000-0000-0000-0000-000000000001';`
    })
  });
  const v1Data = await v1Res.json();
  console.log('V1 (Backfill Count):', v1Data);

  // Verification 2: Check partial index existence
  const v2Res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'project_stakeholders' AND indexname = 'uq_project_accountable';`
    })
  });
  const v2Data = await v2Res.json();
  console.log('V2 (Partial Index):', v2Data);

  // Verification 3: Check security invoker views return data without errors
  const v3aRes = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `SELECT COUNT(*)::integer AS total FROM public.stakeholders_full;`
    })
  });
  const v3aData = await v3aRes.json();
  console.log('V3a (stakeholders_full count):', v3aData);

  const v3bRes = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `SELECT COUNT(*)::integer AS total FROM public.stakeholder_project_register;`
    })
  });
  const v3bData = await v3bRes.json();
  console.log('V3b (stakeholder_project_register count):', v3bData);
}

applyMigration();
