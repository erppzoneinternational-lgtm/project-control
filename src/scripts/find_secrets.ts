import fs from 'fs';
import path from 'path';

function searchFiles(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
        searchFiles(fullPath);
      }
    } else {
      if (entry.name.endsWith('.md') || entry.name.endsWith('.json') || entry.name.endsWith('.sql') || entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.includes('env')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('service_role') || content.includes('postgres:') || content.includes('postgresql:') || content.includes('5432') || content.includes('db.') || content.includes('rpc(') || content.includes('execute_sql')) {
            console.log('MATCH in', fullPath);
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              if (line.includes('service_role') || line.includes('postgres:') || line.includes('postgresql:') || line.includes('5432') || line.includes('rpc') || line.includes('execute')) {
                console.log(`  L${idx+1}: ${line.trim()}`);
              }
            });
          }
        } catch (e) {}
      }
    }
  }
}

searchFiles('D:\\ERP\\Project\\Pzone Prortal\\Project Management\\2. Post Contract\\1. Project Setup\\1. Project\\pzone-project-setup');
