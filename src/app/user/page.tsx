// src/app/account/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';
import { useUser } from '@/context/UserContext';

type Profile = {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email: string;
  username?: string | null;
  countryCode?: string | null;
  phone?: string | null;
};

// ✅ أضفنا 'teal'
type ThemeKey = 'light' | 'dark1' | 'dark2' | 'dark3' | 'teal';

// ✅ أضفنا خيار teal في القائمة مع ألوان المعاينة
const THEME_ITEMS: {
  key: ThemeKey;
  name: string;
  hintBg: string;
  hintText: string;
  hintBorder: string;
}[] = [
  { key: 'light', name: 'الافتراضي (فاتح)', hintBg: '#ffffff', hintText: '#111827', hintBorder: '#e5e7eb' },
  { key: 'dark1', name: 'Dark 1',            hintBg: '#1f2937', hintText: '#ffffff', hintBorder: '#4b5563' },
  { key: 'dark2', name: 'Dark 2',            hintBg: '#1e293b', hintText: '#ffffff', hintBorder: '#475569' },
  { key: 'dark3', name: 'Dark 3',            hintBg: '#18181b', hintText: '#ffffff', hintBorder: '#3f3f46' },
  { key: 'teal',  name: 'Teal',              hintBg: '#309898', hintText: '#ffffff', hintBorder: '#1f6d6d' }, // 👈 جديد
];

export default function UserProfilePage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [theme, setTheme] = useState<ThemeKey>('light');
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeMsg, setThemeMsg] = useState<string | null>(null);

  // جلب بيانات البروفايل
  useEffect(() => {
    const fromContext: Profile | null = user
      ? {
          fullName: (user as any)?.fullName ?? null,
          firstName: (user as any)?.firstName ?? null,
          lastName: (user as any)?.lastName ?? null,
          email: (user as any)?.email,
          username: (user as any)?.username ?? null,
          countryCode: (user as any)?.countryCode ?? null,
          phone: (user as any)?.phone ?? null,
        }
      : null;

    if (fromContext && fromContext.email) {
      setProfile(fromContext);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get<Profile>(
          (API_ROUTES.users as any).profileWithCurrency || API_ROUTES.users.profile
        );
        setProfile(data);
      } catch {
        setErr('تعذّر جلب بيانات الملف الشخصي');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // —— تطبيق الثيم مبدئيًا (ندعم القيم القديمة الفارغة)
  useEffect(() => {
    try {
      const el = document.documentElement;
      const fromAttrRaw = (el.getAttribute('data-theme') || '') as string;
      const fromStorageRaw = (localStorage.getItem('theme') || '') as string;

      const allowed = new Set<ThemeKey>(['light', 'dark1', 'dark2', 'dark3', 'teal']);
      const norm = (v: string): ThemeKey =>
        v === '' ? 'light' : (allowed.has(v as ThemeKey) ? (v as ThemeKey) : 'light');

      const initial: ThemeKey = norm(fromStorageRaw || fromAttrRaw || 'light');
      applyTheme(initial, { persist: false });
      setTheme(initial);
    } catch {
      applyTheme('light', { persist: false });
      setTheme('light');
    }
  }, []);

  // تطبيق الثيم على <html> + تحديث meta
  const applyTheme = (t: ThemeKey, opts: { persist?: boolean } = { persist: true }) => {
    const el = document?.documentElement;
    if (!el) return;

    // إن كنت تفضّل وجود data-theme دائمًا حتى للوضع الفاتح، استبدل removeAttribute بالسطر التالي:
    // el.setAttribute('data-theme', t);
    if (t === 'light') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', t);

    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (meta) meta.content = t === 'light' ? '#ffffff' : '#0F1115';

    if (opts.persist) {
      try { localStorage.setItem('theme', t); } catch {}
    }
  };

  const saveThemePref = async (t: ThemeKey) => {
    setTheme(t);
    applyTheme(t, { persist: true });

    try {
      setSavingTheme(true);
      setThemeMsg(null);
      // إن أردت تخزينه في الخادم لاحقًا:
      // await api.post(API_ROUTES.users.saveTheme, { theme: t });
      setThemeMsg('✅ تم تطبيق المظهر');
    } catch {
      setThemeMsg('❌ لم يتم حفظ التفضيل على الخادم، لكن تم تطبيقه محليًا');
    } finally {
      setSavingTheme(false);
      setTimeout(() => setThemeMsg(null), 2000);
    }
  };

  const fullName =
    profile?.fullName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    '';

  const phoneDisplay = [profile?.countryCode, profile?.phone].filter(Boolean).join(' ');

  return (
    <div className="min-h-[70vh] flex items-start justify-center p-4 bg-bg-base text-text-primary">
      <div className="w-full max-w-lg card p-6 shadow">
        <h1 className="text-2xl font-semibold mb-6">الملف الشخصي</h1>

        {loading && <div className="text-sm text-text-secondary">جاري تحميل البيانات...</div>}

        {err && <div className="mb-4 text-sm text-danger">{err}</div>}

        {!loading && profile && (
          <div className="space-y-6">
            {/* الاسم والكنية */}
            <div>
              <label className="block mb-1 text-sm text-text-secondary">الاسم والكنية</label>
              <input
                type="text"
                value={fullName}
                disabled
                className="input w-full bg-bg-input border-border"
              />
            </div>

            {/* البريد الإلكتروني */}
            <div>
              <label className="block mb-1 text-sm text-text-secondary">البريد الإلكتروني</label>
              <input
                type="email"
                value={profile.email || ''}
                disabled
                className="input w-full bg-bg-input border-border"
              />
            </div>

            {/* اسم المستخدم */}
            <div>
              <label className="block mb-1 text-sm text-text-secondary">اسم المستخدم</label>
              <input
                type="text"
                value={profile.username || ''}
                disabled
                className="input w-full bg-bg-input border-border"
              />
            </div>

            {/* رقم الجوال */}
            <div>
              <label className="block mb-1 text-sm text-text-secondary">رقم الجوال (مع النداء)</label>
              <input
                type="text"
                value={phoneDisplay}
                disabled
                className="input w-full bg-bg-input border-border"
              />
            </div>

            {/* المظهر (الثيم) */}
            <div>
              <label className="block mb-2 text-sm text-text-secondary">المظهر</label>

              <div className="flex flex-wrap items-center gap-3">
                {THEME_ITEMS.map((t) => {
                  const active = t.key === theme;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => saveThemePref(t.key)}
                      disabled={savingTheme}
                      className={[
                        'group relative flex items-center gap-3 px-3 py-2 rounded-lg border transition',
                        active ? 'border-primary bg-primary/10' : 'border-border hover:bg-bg-surface-alt',
                      ].join(' ')}
                      aria-pressed={active}
                    >
                      {/* كرة اللون */}
                      <span
                        className="inline-block w-6 h-6 rounded-full border"
                        style={{
                          background: t.hintBg,
                          borderColor: t.hintBorder,
                          boxShadow: `inset 0 0 0 2px ${t.hintBg === '#ffffff' ? '#f3f4f6' : 'rgba(255,255,255,.06)'}`,
                        }}
                        aria-hidden
                      />
                      <span className={active ? 'text-text-primary font-medium' : 'text-text-primary'}>
                        {t.name}
                      </span>

                      {active && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>

              {themeMsg && (
                <div className={`mt-2 text-sm ${themeMsg.startsWith('✅') ? 'text-success' : 'text-warning'}`}>
                  {themeMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
