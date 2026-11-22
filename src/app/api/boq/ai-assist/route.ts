import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AI_PROVIDERS, chatJSON, resolveAiCredential } from '@/lib/ai/providers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL_REGEX = /^[a-zA-Z0-9._:-]{1,64}$/;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_ENTRIES = 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    if (!entry && rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
      for (const [k, v] of rateLimitMap) {
        if (now > v.resetAt) rateLimitMap.delete(k);
      }
      while (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
        const oldestKey = rateLimitMap.keys().next().value;
        if (oldestKey === undefined) break;
        rateLimitMap.delete(oldestKey);
      }
    }
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

/**
 * AI assistant for BOQ organisation. Suggestions only — client confirms before saving.
 * actions:
 *  - analyze_sheets: { sheets: [{ sheetName, sampleRows: string[][] }] }
 *      → { sheets: [{ sheetName, pageName, isOptional, headerRowIndex, columns:{sn,description,unit,qty,rate,amount}, notes }] }
 *  - classify_items: { pages: [{id,name}], items: [{id, code, description, notes}] }
 *      → { assignments: [{ itemId, pageId|null, newPageName?, confidence, reason }] }
 */
export async function POST(req: NextRequest) {
  const sb = await createSupabaseServerClient();
  let userId: string | null = null;
  try {
    userId = (await sb.auth.getUser()).data.user?.id ?? null;
  } catch {
    /* ignore */
  }
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Enforce active profile & block viewer-only users
  const { data: profile, error: profileErr } = await sb
    .from('profiles')
    .select('roles, is_active, status')
    .eq('id', userId)
    .maybeSingle();

  if (
    profileErr ||
    !profile ||
    profile.is_active === false ||
    (profile.status && profile.status !== 'active')
  ) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const roles: string[] = Array.isArray(profile.roles) ? profile.roles : [];
  const isViewerOnly = roles.length === 0 || roles.every((r) => r === 'viewer');
  if (isViewerOnly) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Per-user bounded rate limit
  if (!checkUserRateLimit(userId)) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
  }

  const cred = await resolveAiCredential(userId, sb);
  if (!cred) return NextResponse.json({ error: 'no_ai_key', aiAvailable: false }, { status: 200 });

  const body = await req.json().catch(() => ({}));
  if (body.model !== undefined && body.model !== null && body.model !== '') {
    if (typeof body.model !== 'string' || !MODEL_REGEX.test(body.model.trim())) {
      return NextResponse.json({ error: 'invalid model' }, { status: 400 });
    }
    cred.model = body.model.trim();
  } else if (cred.provider !== 'openrouter' && !MODEL_REGEX.test(cred.model)) {
    cred.model = AI_PROVIDERS[cred.provider].defaultModel;
  }

  const meta = { provider: cred.provider, model: cred.model, source: cred.source };

  try {
    if (body.action === 'analyze_sheets') {
      const sheets = (body.sheets || [])
        .slice(0, 40)
        .map((s: { sheetName: string; sampleRows: unknown[][] }) => ({
          sheetName: String(s.sheetName).slice(0, 80),
          sampleRows: (s.sampleRows || [])
            .slice(0, 14)
            .map((r) => (r || []).slice(0, 10).map((c) => String(c ?? '').slice(0, 80))),
        }));
      const system = `You are a senior construction quantity surveyor (Egypt/GCC, FIDIC). You receive Excel BOQ sheets (first rows only).
For each sheet return:
- pageName: clean professional page title keeping the facility identity, e.g. "Civil Lagoon 01" -> "Civil Works – Lagoon 1", "MECHANICAL Lagoon01" -> "Mechanical – Lagoon 1", "Optional Scop" -> "Optional Scope". Never merge sheets. Keep numbering.
- isOptional: true if the sheet is optional / provisional / alternative scope.
- headerRowIndex: 0-based index of the header row in sampleRows, or -1.
- columns: 0-based column indexes for sn, description, unit, qty, rate, amount (-1 if absent).
- notes: one short Arabic sentence about anything suspicious (empty if fine).
Return JSON: {"sheets":[{"sheetName":"","pageName":"","isOptional":false,"headerRowIndex":0,"columns":{"sn":0,"description":1,"unit":2,"qty":3,"rate":4,"amount":5},"notes":""}]}`;
      const out = await chatJSON(cred, system, JSON.stringify({ sheets }));
      return NextResponse.json({ ...(out as object), aiAvailable: true, meta });
    }

    if (body.action === 'classify_items') {
      const pages = (body.pages || [])
        .slice(0, 80)
        .map((p: { id: string; name: string }) => ({ id: p.id, name: String(p.name).slice(0, 80) }));
      const items = (body.items || [])
        .slice(0, 300)
        .map((i: { id: string; code?: string; description?: string; notes?: string }) => ({
          id: i.id,
          code: String(i.code ?? '').slice(0, 60),
          description: String(i.description ?? '').slice(0, 220),
          notes: String(i.notes ?? '').slice(0, 120),
        }));
      const system = `You are a senior construction quantity surveyor. Assign each BOQ item to exactly one existing BOQ page (an imported Excel sheet such as "Civil Works – Lagoon 1", "Civil Works – Pump Room 1", "Mechanical – Lagoon 1", "Optional Scope").
Use item code prefixes (e.g. CIVIL-LAGOON-01-*), notes ("Imported from X → Sheet"), and description semantics (pump room civil works go to the Pump Room civil page; pumps/pipes/filters go to Mechanical; cables/panels/lighting go to Electrical).
If none fits, set pageId null and propose newPageName. confidence 0..1. reason: short Arabic.
Return JSON: {"assignments":[{"itemId":"","pageId":"","newPageName":null,"confidence":0.9,"reason":""}]}`;
      const out = await chatJSON(cred, system, JSON.stringify({ pages, items }));
      return NextResponse.json({ ...(out as object), aiAvailable: true, meta });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, aiAvailable: true, meta }, { status: 502 });
  }
}
