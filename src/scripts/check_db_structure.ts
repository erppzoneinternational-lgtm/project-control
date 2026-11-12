import fs from 'fs';

async function checkDbStructure() {
  const tokenFile = 'C:\\Users\\Hassan\\.gemini\\antigravity\\mcp_oauth_tokens.json';
  const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  const accessToken = tokens['https://mcp.supabase.com/mcp'].token.access_token;
  const projectId = 'dwpdrclupradpnsminvi';

  async function query(sql: string) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    return await res.json();
  }

  console.log('--- checking schemas and tables ---');
  const tables = await query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema IN ('public', 'pm')
    ORDER BY table_schema, table_name;
  `);
  console.log('Tables:', tables);

  console.log('--- checking stakeholders columns ---');
  const stkCols = await query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'stakeholders' AND table_schema = 'public';
  `);
  console.log('stakeholders cols:', stkCols);

  console.log('--- checking pm.projects columns ---');
  const projCols = await query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'projects' AND table_schema = 'pm';
  `);
  console.log('pm.projects cols:', projCols);
}

checkDbStructure();
