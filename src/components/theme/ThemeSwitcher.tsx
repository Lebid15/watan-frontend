'use client';

import { useEffect, useState } from 'react';

const THEMES = ['dark1', 'dark2', 'dark3', 'light'] as const;
type Theme = typeof THEMES[number];

// ألوان المعاينة للنقاط (فقط للعرض)
const PREVIEWS: Record<Theme, { bg: string; label: string }> = {
  dark1: { bg: '#1A1D24', label: 'Dark 1' },
  dark2: { bg: '#14171E', label: 'Dark 2 (High Contrast)' },
  dark3: { bg: '#191613', label: 'Dark 3 (Warm)' },
  light: { bg: '#FFFFFF', label: 'Light' },
};

function applyTheme(t: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', t);
}

export default function ThemeSwitcher({
  size = 22, // حجم الدوائر بالبكسل
  gap = 8,   // المسافة بين الدوائر
  className = '',
}: { size?: number; gap?: number; className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark1');

  useEffect(() => {
    // حاول قراءة الثيم المحفوظ
    const saved = (typeof window !== 'undefined' && localStorage.getItem('theme')) as Theme | null;
    const initial: Theme =
      saved && THEMES.includes(saved) ? saved :
      // إن لم يوجد محفوظ، اختَر dark1 افتراضيًا
      'dark1';

    setTheme(initial);
    applyTheme(initial);
  }, []);

  const onPick = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', t);
    }
  };

  return (
    <div
      className={`flex items-center`}
      style={{ gap }}
      aria-label="Theme switcher"
    >
      {THEMES.map((t) => {
        const isActive = t === theme;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onPick(t)}
            title={PREVIEWS[t].label}
            aria-label={PREVIEWS[t].label}
            className={[
              // إطار خفيف في الوضع الداكن، وإطار أغمق في الوضع الفاتح
              'rounded-full border transition-transform',
              isActive ? 'ring-2 ring-[rgb(var(--color-primary))] scale-105' : 'hover:scale-105',
            ].join(' ')}
            style={{
              width: size,
              height: size,
              background: PREVIEWS[t].bg,
              borderColor: 'rgb(var(--color-border))',
            }}
          />
        );
      })}
    </div>
  );
}
