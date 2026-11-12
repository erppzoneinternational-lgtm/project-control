import fs from 'fs';

async function testManagementApi() {
  const tokenFile = 'C:\\Users\\Hassan\\.gemini\\antigravity\\mcp_oauth_tokens.json';
  const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  const accessToken = tokens['https://mcp.supabase.com/mcp'].token.access_token;
  console.log('Access token loaded:', accessToken.substring(0, 15) + '...');

  const projectId = 'dwpdrclupradpnsminvi';
  
  // Try /v1/projects/{ref}/database/query or /v1/projects/{ref}/query
  const endpoints = [
    `https://api.supabase.com/v1/projects/${projectId}/query`,
    `https://api.supabase.com/v1/projects/${projectId}/database/query`
  ];

  for (const url of endpoints) {
    console.log('Testing endpoint:', url);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: 'SELECT 1 as test;' })
      });
      console.log('Status:', res.status, res.statusText);
      const text = await res.text();
      console.log('Response:', text);
      if (res.ok) {
        console.log('✅ MANAGEMENT API QUERY WORKED!');
      }
    } catch (e: any) {
      console.error('Fetch error:', e.message);
    }
  }
}

testManagementApi();
