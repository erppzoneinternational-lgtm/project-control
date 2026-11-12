'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>خطأ في تشغيل المنظومة | P.ZONE ERP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #090a0f;
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            direction: rtl;
          }
          .card {
            background: #0f172a;
            border: 1px solid rgba(244, 63, 94, 0.3);
            border-radius: 24px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .icon-badge {
            width: 64px;
            height: 64px;
            background: rgba(244, 63, 94, 0.15);
            border: 1px solid rgba(244, 63, 94, 0.3);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px auto;
            color: #fb7185;
            font-size: 28px;
          }
          .pill {
            display: inline-block;
            background: rgba(244, 63, 94, 0.1);
            color: #fda4af;
            border: 1px solid rgba(244, 63, 94, 0.2);
            padding: 4px 14px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 12px;
          }
          h1 {
            font-size: 22px;
            font-weight: 900;
            margin-bottom: 12px;
            color: #ffffff;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            color: #94a3b8;
            margin-bottom: 24px;
          }
          .btn-group {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
          }
          .btn-primary {
            background: #059669;
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            border-radius: 14px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.2s;
            text-decoration: none;
          }
          .btn-primary:hover {
            background: #047857;
          }
          .btn-secondary {
            background: #1e293b;
            color: #e2e8f0;
            border: 1px solid #334155;
            padding: 12px 20px;
            border-radius: 14px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
          }
          .btn-secondary:hover {
            background: #334155;
          }
          .digest {
            margin-top: 20px;
            font-family: monospace;
            font-size: 11px;
            color: #64748b;
            direction: ltr;
          }
        `}</style>
      </head>
      <body>
        <div className="card" role="alert" aria-live="assertive">
          <div className="icon-badge">⚠️</div>
          <div className="pill">استعادة المنظومة الأساسية | System Recovery</div>
          <h1>تعذر تشغيل المنظومة بشكل صحيح</h1>
          <p>
            نعتذر، حدث تعثر غير متوقع على المستوى الأساسي للمنظومة. بياناتك ومؤشراتك محفوظة ولم تتأثر. يرجى إعادة المحاولة أو إعادة تحميل الصفحة.
          </p>
          <div className="btn-group">
            <button type="button" className="btn-primary" onClick={() => reset()}>
              إعادة المحاولة / Try Again
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/dashboard';
              }}
            >
              العودة للوحة القيادة
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (typeof window !== 'undefined') window.location.reload();
              }}
            >
              تحديث الصفحة
            </button>
          </div>
          {error?.digest && <div className="digest">Digest ID: {error.digest}</div>}
        </div>
      </body>
    </html>
  );
}
