import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { encryptSecret } from '@/lib/ai/crypto';
import { AI_PROVIDERS, AiProvider, chatJSON } from '@/lib/ai/providers';

export const dynamic = 'force-dynamic';

const MODEL_REGEX = /^[a-zA-Z0-9._:-]{1,64}$/;
const MAX_API_KEY_LENGTH = 512;

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type AuthorizedContext =
  | { ok: true; uid: string; sb: ServerSupabaseClient }
  | { ok: false; response: NextResponse };

async function requireActiveNonViewerUser(): Promise<AuthorizedContext> {
  const sb = await createSupabaseServerClient();
  let uid: string | null = null;
  try {
    const { data } = await sb.auth.getUser();
    uid = data.user?.id ?? null;
  } catch {
    uid = null;
  }
  if (!uid) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    };
  }

  const { data: profile, error: profileErr } = await sb
    .from('profiles')
    .select('roles, is_active, status')
    .eq('id', uid)
    .maybeSingle();

  if (
    profileErr ||
    !profile ||
    profile.is_active === false ||
    (profile.status && profile.status !== 'active')
  ) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    };
  }

  const roles: string[] = Array.isArray(profile.roles) ? profile.roles : [];
  const isViewerOnly = roles.length === 0 || roles.every((r) => r === 'viewer');
  if (isViewerOnly) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, uid, sb };
}

/** GET: list my keys (masked). Never returns the key itself. */
export async function GET() {
  const auth = await requireActiveNonViewerUser();
  if (!auth.ok) return auth.response;

  const { uid, sb } = auth;
  const { data, error } = await sb
    .from('pm_user_ai_keys')
    .select('id, provider, model, key_last4, is_default, updated_at')
    .eq('user_id', uid)
    .order('provider');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    keys: data ?? [],
    providers: AI_PROVIDERS,
    systemKeyAvailable: !!process.env.GEMINI_API_KEY,
  });
}

/** POST: {provider, apiKey, model?, isDefault?, test?} — validates then stores encrypted. */
export async function POST(req: NextRequest) {
  const auth = await requireActiveNonViewerUser();
  if (!auth.ok) return auth.response;

  const { uid, sb } = auth;
  const body = await req.json().catch(() => ({}));
  const provider = body.provider as AiProvider;
  if (!provider || !(provider in AI_PROVIDERS)) {
    return NextResponse.json({ error: 'invalid provider' }, { status: 400 });
  }

  if (typeof body.apiKey !== 'string') {
    return NextResponse.json({ error: 'invalid key' }, { status: 400 });
  }
  const apiKey = body.apiKey.trim();
  if (apiKey.length < 10 || apiKey.length > MAX_API_KEY_LENGTH) {
    return NextResponse.json({ error: 'invalid key' }, { status: 400 });
  }

  let model = AI_PROVIDERS[provider].defaultModel;
  if (body.model !== undefined && body.model !== null && body.model !== '') {
    if (typeof body.model !== 'string' || !MODEL_REGEX.test(body.model.trim())) {
      return NextResponse.json({ error: 'invalid model' }, { status: 400 });
    }
    model = body.model.trim();
  }

  // Live validation before storing
  try {
    await chatJSON(
      { provider, model, apiKey, source: 'user' },
      'You are a health check.',
      'Return {"ok":true}',
      20000
    );
  } catch (e) {
    return NextResponse.json({ error: `فشل اختبار المفتاح: ${(e as Error).message}` }, { status: 400 });
  }

  if (body.isDefault) {
    await sb.from('pm_user_ai_keys').update({ is_default: false }).eq('user_id', uid);
  }
  const { error } = await sb.from('pm_user_ai_keys').upsert(
    {
      user_id: uid,
      provider,
      model,
      encrypted_key: encryptSecret(apiKey),
      key_last4: apiKey.slice(-4),
      is_default: !!body.isDefault,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE ?provider=gemini */
export async function DELETE(req: NextRequest) {
  const auth = await requireActiveNonViewerUser();
  if (!auth.ok) return auth.response;

  const { uid, sb } = auth;
  const provider = new URL(req.url).searchParams.get('provider');
  if (!provider || !(provider in AI_PROVIDERS)) {
    return NextResponse.json({ error: 'invalid provider' }, { status: 400 });
  }
  const { error } = await sb
    .from('pm_user_ai_keys')
    .delete()
    .eq('user_id', uid)
    .eq('provider', provider);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
