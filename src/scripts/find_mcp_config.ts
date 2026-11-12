import fs from 'fs';
import path from 'path';

function searchUserDir(dir: string, depth = 0) {
  if (depth > 4) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'AppData' && entry.name !== 'Downloads') {
          searchUserDir(fullPath, depth + 1);
        } else if (entry.name === '.gemini' || entry.name === '.supabase' || entry.name === '.config') {
          searchUserDir(fullPath, depth + 1);
        }
      } else {
        if (entry.name.includes('config') || entry.name.includes('token') || entry.name.includes('mcp') || entry.name.includes('env') || entry.name.includes('supabase')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('sbp_') || content.includes('dwpdrclupradpnsminvi') || content.includes('SUPABASE_ACCESS_TOKEN')) {
              console.log('FOUND TOKEN/CONFIG IN:', fullPath);
              console.log(content.substring(0, 500));
            }
          } catch(e) {}
        }
      }
    }
  } catch(e) {}
}

searchUserDir('C:\\Users\\Hassan');
searchUserDir('C:\\Users\\Hassan\\.gemini');
searchUserDir('C:\\Users\\Hassan\\AppData\\Roaming\\Antigravity');
searchUserDir('C:\\Users\\Hassan\\AppData\\Local\\Programs\\antigravity');
