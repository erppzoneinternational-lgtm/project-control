import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { decryptSecret } from './crypto';

export type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'openrouter';

export const AI_PROVIDERS: Record<AiProvider, { label: string; defaultModel: string }> = {
  gemini: { label: 'Google Gemini', defaultModel: 'gemini-flash-latest' },
  openai: { label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
  anthropic: { label: 'Anthropic Claude', defaultModel: 'claude-3-5-haiku-latest' },
  openrouter: { label: 'OpenRouter', defaultModel: 'google/gemini-flash-1.5' },
};

export interface AiCredential {
  provider: AiProvider;
  model: string;
  apiKey: string;
  source: 'user' | 'system';
}

/** Resolve key: user's default (or first) BYOK key → system GEMINI_API_KEY → null. */
export async function resolveAiCredential(userId: string | null): Promise<AiCredential | null> {
  if (userId) {
    try {
      const admin = createSupabaseAdminClient();
      const { data } = await admin
        .from('pm_user_ai_keys')
        .select('provider, model, encrypted_key, is_default')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.encrypted_key) {
        const provider = data.provider as AiProvider;
        return {
          provider,
          model: data.model || AI_PROVIDERS[provider].defaultModel,
          apiKey: decryptSecret(data.encrypted_key),
          source: 'user',
        };
      }
    } catch {
      /* fall through to system key */
    }
  }
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || AI_PROVIDERS.gemini.defaultModel,
      apiKey: process.env.GEMINI_API_KEY,
      source: 'system',
    };
  }
  return null;
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    if (s >= 0 && e > s) return JSON.parse(cleaned.slice(s, e + 1));
    throw new Error('AI returned non-JSON output');
  }
}

/** Single-shot prompt that must return a JSON object. Provider-agnostic. */
export async function chatJSON<T = unknown>(
  cred: AiCredential,
  system: string,
  user: string,
  timeoutMs = 45000
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    let text = '';
    if (cred.provider === 'gemini') {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cred.model)}:generateContent`,
        {
          method: 'POST',
          signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cred.apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
          }),
        }
      );
      if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
      const j = await r.json();
      text = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
    } else if (cred.provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cred.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: cred.model,
          max_tokens: 8000,
          system: `${system}\nRespond with a single JSON object only.`,
          messages: [{ role: 'user', content: user }],
        }),
      });
      if (!r.ok) throw new Error(`Anthropic ${r.status}: ${(await r.text()).slice(0, 300)}`);
      const j = await r.json();
      text = j?.content?.map((c: { text?: string }) => c.text || '').join('') || '';
    } else {
      const url =
        cred.provider === 'openrouter'
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
      const r = await fetch(url, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cred.apiKey}` },
        body: JSON.stringify({
          model: cred.model,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
      if (!r.ok) throw new Error(`${cred.provider} ${r.status}: ${(await r.text()).slice(0, 300)}`);
      const j = await r.json();
      text = j?.choices?.[0]?.message?.content || '';
    }
    return extractJson(text) as T;
  } finally {
    clearTimeout(timer);
  }
}
