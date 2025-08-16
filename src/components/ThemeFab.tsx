'use client';

import { useEffect, useState } from 'react';

type ThemeKey = 'light' | 'dark1' | 'dark2' | 'dark3';

const THEMES: { key: ThemeKey; label: string; preview: string }[] = [
  { key: 'light', label: 'Light', preview: '#ffffff' },
  { key: 'dark1', label: 'Dark 1', preview: '#111827' },
  { key: 'dark2', label: 'Dark 2', preview: '#0f172a' },
  { key: 'dark3', label: 'Dark 3', preview: '#000000' },
];

export default function ThemeFab() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ThemeKey>('dark1');

  useEffect(() => {
    const attr = document.documentElement.getAttribute('data-theme') as ThemeKey | null;
    const fromLS = (typeof window !== 'undefined' ? localStorage.getItem('theme') : null) as ThemeKey | null;
    const initial: ThemeKey =
      (fromLS && ['light','dark1','dark2','dark3'].includes(fromLS) && fromLS) ||
      (attr && ['light','dark1','dark2','dark3'].includes(attr) && attr) ||
      'dark1';
    applyTheme(initial, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyTheme = (t: ThemeKey, persist = true) => {
    document.documentElement.setAttribute('data-theme', t);
    if (persist) localStorage.setItem('theme', t);
    setCurrent(t);
  };

  return (
    <div className="fixed bottom-4 left-4 z-[10000]">
      {/* FAB دائرية صغيرة */}
      <button
        onClick={() => setOpen(v => !v)}
        className="
          w-12 h-12 rounded-full grid place-items-center shadow-lg border border-border
          bg-bg-surface text-text-primary hover:bg-bg-surface-alt
        "
        aria-label="تبديل الثيم"
        type="button"
      >
        {/* <Palette size={22} /> */}
        <span className="text-lg">🎨</span>
      </button>

      {/* قائمة دوائر ألوان صغيرة */}
      {open && (
        <div className="mt-2 p-2 rounded-xl border border-border bg-bg-surface shadow-xl">
          <div className="flex items-center gap-2">
            {THEMES.map(t => (
              <button
                key={t.key}
                onClick={() => { applyTheme(t.key); setOpen(false); }}
                className={`
                  w-8 h-8 rounded-full ring-2
                  ${current === t.key ? 'ring-primary' : 'ring-border'}
                `}
                style={{ backgroundColor: t.preview }}
                title={t.label}
                aria-label={t.label}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
