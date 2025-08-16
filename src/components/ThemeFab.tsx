'use client';

import { useEffect, useState } from 'react';

const THEMES = ['dark1', 'dark2', 'dark3', 'light'] as const;
type Theme = typeof THEMES[number];

function getSavedTheme(): Theme {
  if (typeof document !== 'undefined') {
    // جرّب أولاً ما هو مطبق على <html>
    const attr = document.documentElement.getAttribute('data-theme') as Theme | null;
    if (attr && (THEMES as readonly string[]).includes(attr)) return attr as Theme;
  }
  try {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved && (THEMES as readonly string[]).includes(saved)) return saved as Theme;
  } catch {}
  return 'dark1';
}

function applyTheme(t: Theme) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  if (html.getAttribute('data-theme') !== t) {
    html.setAttribute('data-theme', t);
  }
  // حدّث شريط المتصفح
  const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (meta) meta.content = t === 'light' ? '#ffffff' : '#0F1115';
}

export default function ThemeFab({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark1');

  // قراءة الثيم المطبق/المحفوظ مرّة واحدة عند التحميل — بدون إعادة الكتابة
  useEffect(() => {
    const initial = getSavedTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const pick = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
    try { localStorage.setItem('theme', t); } catch {}
    setOpen(false);
  };

  return (
    <div
      className={[
        // ✅ مخفي على الموبايل — يظهر من md وأكبر
        'hidden md:block',
        'fixed bottom-5 right-5 z-[9999]',
        className,
      ].join(' ')}
    >
      {/* الزر الرئيسي */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="rounded-full shadow-lg border border-border bg-bg-surface text-text-primary w-11 h-11 grid place-items-center hover:bg-bg-surface-alt"
        aria-label="تبديل الثيم"
        title="تبديل الثيم"
      >
        🎨
      </button>

      {/* القائمة المنبثقة */}
      {open && (
        <div className="mt-2 p-2 rounded-xl border border-border bg-bg-surface shadow-xl">
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => pick(t)}
                title={t}
                aria-label={`اختر ثيم ${t}`}
                className={[
                  'w-8 h-8 rounded-full border border-border transition-all',
                  theme === t ? 'ring-2 ring-primary scale-105' : 'hover:scale-105',
                ].join(' ')}
                style={{
                  background:
                    t === 'dark1' ? '#111827' :
                    t === 'dark2' ? '#0F172A' :
                    t === 'dark3' ? '#18181B' :
                    '#ffffff',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
