import fs from 'fs';
import path from 'path';

async function runReviewVerification() {
  const tokenFile = 'C:\\Users\\Hassan\\.gemini\\antigravity\\mcp_oauth_tokens.json';
  const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  const accessToken = tokens['https://mcp.supabase.com/mcp'].token.access_token;
  const projectId = 'dwpdrclupradpnsminvi';

  const runQuery = async (sql: string) => {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  };

  console.log('====================================================');
  console.log('  MILESTONE M1 INDEPENDENT REVIEW & ADVERSARIAL VERIFICATION');
  console.log('====================================================\n');

  // Test 1: Organizations Table & Default Tenant
  console.log('--- Test 1: Organizations Table & Default Tenant ---');
  const orgCheck = await runQuery(`
    SELECT id, name, name_ar, code, org_type, is_active
    FROM public.organizations
    WHERE id = '00000000-0000-0000-0000-000000000001';
  `);
  console.log('Organizations check:', JSON.stringify(orgCheck.data, null, 2));

  // Test 2: Stakeholders Columns & Backfill Count
  console.log('\n--- Test 2: Stakeholders Schema Expansion & Backfill Count ---');
  const stkCount = await runQuery(`
    SELECT 
      COUNT(*)::integer AS total_stakeholders,
      COUNT(CASE WHEN organization_id = '00000000-0000-0000-0000-000000000001' THEN 1 END)::integer AS org_backfilled,
      COUNT(CASE WHEN stakeholder_kind = 'employee' THEN 1 END)::integer AS employees_count,
      COUNT(CASE WHEN organization_id IS NULL OR stakeholder_kind IS NULL THEN 1 END)::integer AS null_fields_count
    FROM public.stakeholders;
  `);
  console.log('Stakeholders backfill check:', JSON.stringify(stkCount.data, null, 2));

  // Test 3: Constraint chk_stakeholder_kind_relations
  console.log('\n--- Test 3: CHECK Constraint chk_stakeholder_kind_relations Verification ---');
  const constrCheck = await runQuery(`
    SELECT conname, pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conrelid = 'public.stakeholders'::regclass
      AND conname = 'chk_stakeholder_kind_relations';
  `);
  console.log('Constraint definition:', JSON.stringify(constrCheck.data, null, 2));

  // Adversarial sub-test 3b: Test invalid stakeholder_kind insert
  console.log('\n--- Test 3b: Adversarial Insert - Invalid stakeholder_kind ---');
  const dummyId = 'test-invalid-kind-' + Date.now();
  const invalidInsert = await runQuery(`
    INSERT INTO public.stakeholders (id, name, code, stakeholder_kind, client_id)
    VALUES ('${dummyId}', 'Test User', 'TEST001', 'employee', '00000000-0000-0000-0000-000000000002');
  `);
  console.log('Invalid insert result (expected error):', invalidInsert.data);

  // Test 4: Project Stakeholders Table & Partial Unique Index uq_project_accountable
  console.log('\n--- Test 4: Partial Unique Index uq_project_accountable Verification ---');
  const indexCheck = await runQuery(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'project_stakeholders' AND indexname = 'uq_project_accountable';
  `);
  console.log('Partial unique index check:', JSON.stringify(indexCheck.data, null, 2));

  // Adversarial sub-test 4b: Test inserting 2 Accountable roles for the same project
  console.log('\n--- Test 4b: Adversarial Insert - Duplicate Accountable RACI role ---');
  // First get a real project_id and 2 stakeholder_ids
  const sampleProj = await runQuery(`SELECT id FROM pm.projects LIMIT 1;`);
  const sampleStks = await runQuery(`SELECT id FROM public.stakeholders LIMIT 2;`);
  
  if (sampleProj.data?.[0]?.id && sampleStks.data?.length >= 2) {
    const pId = sampleProj.data[0].id;
    const sId1 = sampleStks.data[0].id;
    const sId2 = sampleStks.data[1].id;

    // Clean up any test assignments for this project first
    await runQuery(`DELETE FROM public.project_stakeholders WHERE project_id = '${pId}' AND notes = 'VERIFICATION_TEST';`);

    // Insert 1st accountable
    const ins1 = await runQuery(`
      INSERT INTO public.project_stakeholders (project_id, stakeholder_id, project_role, raci_role, notes)
      VALUES ('${pId}', '${sId1}', 'Project Manager', 'accountable', 'VERIFICATION_TEST');
    `);
    console.log('First Accountable insert:', ins1.ok ? 'SUCCESS' : ins1.data);

    // Try inserting 2nd accountable for same project
    const ins2 = await runQuery(`
      INSERT INTO public.project_stakeholders (project_id, stakeholder_id, project_role, raci_role, notes)
      VALUES ('${pId}', '${sId2}', 'Project Director', 'accountable', 'VERIFICATION_TEST');
    `);
    console.log('Second Accountable insert (expected constraint violation):', ins2.data);

    // Clean up test assignment
    await runQuery(`DELETE FROM public.project_stakeholders WHERE project_id = '${pId}' AND notes = 'VERIFICATION_TEST';`);
  }

  // Test 5: Security Invoker Views
  console.log('\n--- Test 5: Security Invoker Views Verification ---');
  const viewCheck = await runQuery(`
    SELECT c.relname, c.relkind,
           (SELECT options FROM pg_options_to_table(c.reloptions) WHERE option_name = 'security_invoker') AS security_invoker
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN ('stakeholders_full', 'stakeholder_project_register');
  `);
  console.log('Views security_invoker options:', JSON.stringify(viewCheck.data, null, 2));

  const viewQuery1 = await runQuery(`SELECT COUNT(*)::integer AS total FROM public.stakeholders_full;`);
  console.log('stakeholders_full row count:', viewQuery1.data);

  const viewQuery2 = await runQuery(`SELECT COUNT(*)::integer AS total FROM public.stakeholder_project_register;`);
  console.log('stakeholder_project_register row count:', viewQuery2.data);

  // Test 6: RLS & Grants Check
  console.log('\n--- Test 6: RLS & Grants Verification ---');
  const rlsCheck = await runQuery(`
    SELECT relname, relrowsecurity, relforcerowsecurity
    FROM pg_class
    WHERE relname IN ('organizations', 'project_stakeholders');
  `);
  console.log('RLS Status:', JSON.stringify(rlsCheck.data, null, 2));

  const policyCheck = await runQuery(`
    SELECT tablename, policyname, roles, cmd, qual
    FROM pg_policies
    WHERE tablename IN ('organizations', 'project_stakeholders');
  `);
  console.log('Policies list:', JSON.stringify(policyCheck.data, null, 2));

  // Test 7: Migration Idempotency Re-run
  console.log('\n--- Test 7: Idempotency Re-execution Test ---');
  const sqlPath = path.join(__dirname, '../../supabase/migrations/007_stakeholders_phase1_redesign.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const reRunRes = await runQuery(sql);
  console.log('Migration re-execution status:', reRunRes.status, reRunRes.ok ? 'SUCCESS' : reRunRes.data);

  // Re-confirm stakeholder count after re-execution
  const stkCountAfter = await runQuery(`
    SELECT 
      COUNT(*)::integer AS total_stakeholders,
      COUNT(CASE WHEN organization_id = '00000000-0000-0000-0000-000000000001' THEN 1 END)::integer AS org_backfilled,
      COUNT(CASE WHEN stakeholder_kind = 'employee' THEN 1 END)::integer AS employees_count
    FROM public.stakeholders;
  `);
  console.log('Stakeholders backfill check after re-run:', JSON.stringify(stkCountAfter.data, null, 2));

  console.log('\n====================================================');
  console.log('  VERIFICATION COMPLETE');
  console.log('====================================================');
}

runReviewVerification().catch(err => {
  console.error('Error in review verification script:', err);
  process.exit(1);
});
