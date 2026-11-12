import fs from 'fs';

async function checkViewsOptions() {
  const tokenFile = 'C:\\Users\\Hassan\\.gemini\\antigravity\\mcp_oauth_tokens.json';
  const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  const accessToken = tokens['https://mcp.supabase.com/mcp'].token.access_token;
  const projectId = 'dwpdrclupradpnsminvi';

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `SELECT relname, reloptions FROM pg_class WHERE relname IN ('stakeholders_full', 'stakeholder_project_register');`
    })
  });
  const data = await res.json();
  console.log('View reloptions:', JSON.stringify(data, null, 2));
}

checkViewsOptions();
