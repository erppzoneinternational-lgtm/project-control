'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Loader2, Trash2, Sparkles, ShieldCheck } from 'lucide-react';

interface KeyRow { id: string; provider: string; model: string; key_last4: string; is_default: boolean; updated_at: string }
type Providers = Record<string, { label: string; defaultModel: string }>;

/** BYOK: each user may plug in their own AI key (any provider). Keys are encrypted server-side, never returned. */
export function AiKeysCard() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [providers, setProviders] = useState<Providers>({});
  const [systemKey, setSystemKey] = useState(false);
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch('/api/ai/keys');
    if (!res.ok) return;
    const j = await res.json();
    setKeys(j.keys || []);
    setProviders(j.providers || {});
    setSystemKey(!!j.systemKeyAvailable);
  };
  useEffect(() => { void load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/ai/keys', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model: model || undefined, isDefault }),
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.error || 'فشل الحفظ');
      toast.success('تم اختبار المفتاح وحفظه مشفّراً');
      setApiKey(''); setModel('');
      await load();
    } finally { setSaving(false); }
  };

  const remove = async (p: string) => {
    const res = await fetch(`/api/ai/keys?provider=${encodeURIComponent(p)}`, { method: 'DELETE' });
    if (res.ok) { toast.success('تم حذف المفتاح'); await load(); } else toast.error('فشل الحذف');
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-violet-600" /> مفاتيح الذكاء الاصطناعي (AI Keys)
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            يستخدم الموقع Gemini المجاني افتراضياً. يمكنك إضافة مفتاحك الخاص من أي مزوّد وسيُستخدم لك أنت فقط.
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${systemKey ? 'bg-emerald-50 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
          {systemKey ? 'مفتاح النظام متاح' : 'لا يوجد مفتاح نظام'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <select value={provider} onChange={(e) => setProvider(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          {Object.entries(providers).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input
          type="password"
          name="ai_provider_api_key"
          autoComplete="new-password"
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API Key"
          className="md:col-span-2 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
        />
        <input
          type="text"
          name="ai_provider_model"
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={providers[provider]?.defaultModel || 'model'}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> اجعله الافتراضي
        </label>
        <button type="button" onClick={save} disabled={saving || apiKey.trim().length < 10}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold disabled:opacity-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} اختبار وحفظ
        </button>
      </div>

      {keys.length > 0 && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center gap-3 py-2 text-xs">
              <KeyRound className="w-4 h-4 text-slate-400" />
              <span className="font-bold">{providers[k.provider]?.label || k.provider}</span>
              <span className="font-mono text-slate-400">••••{k.key_last4}</span>
              <span className="font-mono text-slate-500">{k.model}</span>
              {k.is_default && <span className="px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-[10px] font-bold">افتراضي</span>}
              <button type="button" onClick={() => remove(k.provider)} aria-label="حذف" className="ms-auto text-rose-500 hover:text-rose-700 dark:text-rose-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-slate-400">🔒 المفتاح يُشفَّر (AES-256-GCM) على الخادم ولا يُعاد للمتصفح أبداً — يظهر آخر 4 أحرف فقط.</p>
    </div>
  );
}
