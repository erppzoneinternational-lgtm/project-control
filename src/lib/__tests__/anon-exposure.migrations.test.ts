/**
 * Anon-exposure alarm (static, migration replay).
 *
 * Replays supabase/migrations/*.sql in filename order and tracks which RLS
 * policies are still alive at the end. Fails if any surviving policy lets
 * `anon` (or PUBLIC) read/write with an always-true rule, or if an `rpc_*`
 * function can still be executed by anon/PUBLIC.
 *
 * Limits: cannot see policies/grants created inside dynamic SQL (EXECUTE
 * format(...)) and cannot see manual changes made in the Supabase dashboard.
 * Pair with the live check in scripts/sql/anon_exposure_audit.sql.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

/** Reviewed, intentional anon exposure. Every entry needs a reason. */
const ALLOWED_ANON_POLICIES: Record<string, string> = {
  // progress-photos bucket is public-read so <img> tags work. NEEDS OWNER DECISION.
  'storage.objects|anon_read_progress_photos': 'public bucket read for site photos (review)',
};
/** rpc_* functions that anon may legitimately call. */
const ALLOWED_ANON_RPCS = new Set(['rpc_health_ping']);

function readMigrations(): { name: string; sql: string }[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((name) => ({
      name,
      sql: fs
        .readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/--.*$/gm, ''),
    }));
}

const normTable = (raw: string): string => {
  const t = raw.replace(/"/g, '').toLowerCase();
  return t.includes('.') ? t : `public.${t}`;
};

interface Policy {
  roles: string[];
  permissive: boolean;
}

const TABLE = '((?:"?[\\w]+"?\\.)?"?[\\w]+"?)';
const CREATE_RE = new RegExp(
  `CREATE\\s+POLICY\\s+(?:"([^"]+)"|(\\w+))\\s+ON\\s+${TABLE}([\\s\\S]*?);`,
  'gi',
);
const DROP_RE = new RegExp(
  `DROP\\s+POLICY\\s+(?:IF\\s+EXISTS\\s+)?(?:"([^"]+)"|(\\w+))\\s+ON\\s+${TABLE}\\s*;`,
  'gi',
);

function parsePolicyBody(body: string): Policy {
  const toMatch = body.match(/\bTO\s+([\w,\s"]+?)(?=\s+(?:USING|WITH)\b|\s*$)/i);
  const roles = toMatch
    ? toMatch[1].split(',').map((r) => r.replace(/"/g, '').trim().toLowerCase())
    : ['public']; // no TO clause => PUBLIC
  const permissive =
    /\bUSING\s*\(\s*true\s*\)/i.test(body) || /\bWITH\s+CHECK\s*\(\s*true\s*\)/i.test(body);
  return { roles, permissive };
}

function replayPolicies(): Map<string, Policy & { file: string }> {
  const alive = new Map<string, Policy & { file: string }>();
  for (const { name, sql } of readMigrations()) {
    const events: { idx: number; kind: 'create' | 'drop'; key: string; policy?: Policy }[] = [];
    for (const m of sql.matchAll(CREATE_RE)) {
      events.push({
        idx: m.index ?? 0,
        kind: 'create',
        key: `${normTable(m[3])}|${m[1] ?? m[2]}`,
        policy: parsePolicyBody(m[4]),
      });
    }
    for (const m of sql.matchAll(DROP_RE)) {
      events.push({ idx: m.index ?? 0, kind: 'drop', key: `${normTable(m[3])}|${m[1] ?? m[2]}` });
    }
    events.sort((a, b) => a.idx - b.idx);
    for (const e of events) {
      if (e.kind === 'drop') alive.delete(e.key);
      else alive.set(e.key, { ...(e.policy as Policy), file: name });
    }
  }
  return alive;
}

describe('anon exposure (migration replay)', () => {
  const files = readMigrations();
  const fileIdx = new Map(files.map((f, i) => [f.name, i]));

  /** Last migration index that ran `REVOKE ALL ON ALL TABLES IN SCHEMA <s> FROM anon`. */
  const blanketRevoke = new Map<string, number>();
  files.forEach(({ sql }, i) => {
    for (const m of sql.matchAll(/REVOKE\s+ALL\s+ON\s+ALL\s+TABLES\s+IN\s+SCHEMA\s+(\w+)\s+FROM\s+anon/gi)) {
      blanketRevoke.set(m[1].toLowerCase(), i);
    }
  });

  it('leaves no always-true RLS policy open to anon/PUBLIC', () => {
    const offenders: string[] = [];
    for (const [key, p] of replayPolicies()) {
      const exposed = p.roles.includes('anon') || p.roles.includes('public');
      if (!exposed || !p.permissive || key in ALLOWED_ANON_POLICIES) continue;
      const schema = key.split('.')[0];
      const revokedAt = blanketRevoke.get(schema) ?? -1;
      if ((fileIdx.get(p.file) ?? 0) <= revokedAt) continue; // anon has no grants left
      offenders.push(`${key}  (roles=${p.roles.join(',')}, last set in ${p.file})`);
    }
    expect(offenders, `Open to anon:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('adds no new GRANT to anon after the lockdown', () => {
    const lockdown = Math.max(-1, ...blanketRevoke.values());
    expect(lockdown, 'expected a blanket anon revoke migration').toBeGreaterThanOrEqual(0);
    const offenders: string[] = [];
    files.slice(lockdown + 1).forEach(({ name, sql }) => {
      for (const m of sql.matchAll(/GRANT\s+[^;]*?\s+TO\s+[^;]*\banon\b[^;]*;/gi)) {
        if (/rpc_health_ping/i.test(m[0])) continue;
        offenders.push(`${name}: ${m[0].replace(/\s+/g, ' ').slice(0, 120)}`);
      }
    });
    expect(offenders, `New anon grants:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('hardens every rpc_* function against anon/PUBLIC execution', () => {
    const files = readMigrations();
    const created = new Set<string>();
    let lastCreateIdx = -1;
    let lastHardenIdx = -1;

    files.forEach(({ sql }, i) => {
      for (const m of sql.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.(rpc_\w+)/gi)) {
        created.add(m[1]);
        lastCreateIdx = i;
      }
      // Dynamic hardening loop over all rpc_* functions.
      if (/proname\s+LIKE\s+'rpc\\?_%'/i.test(sql) && /REVOKE\s+EXECUTE\s+ON\s+FUNCTION[\s\S]*FROM\s+PUBLIC\s*,\s*anon/i.test(sql)) {
        lastHardenIdx = i;
      }
    });

    const risky = [...created].filter((f) => !ALLOWED_ANON_RPCS.has(f));
    expect(risky.length).toBeGreaterThan(0); // sanity: parser found the rpcs
    expect(
      lastHardenIdx,
      `rpc_* functions (${risky.join(', ')}) may be callable by anon. ` +
        `A hardening migration must exist AFTER the last rpc_ function is created.`,
    ).toBeGreaterThanOrEqual(lastCreateIdx);
  });
});
