// src/app/account/profile/page.tsx  (أو نفس مسارك الحالي لصفحة الملف الشخصي)
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

type ThemeKey = '' | 'dark1' | 'dark2' | 'dark3';

const THEME_ITEMS: { key: ThemeKey; name: string; hintBg: string; hintText: string; hintBorder: string }[] = [
  { key: '',      name: 'الافتراضي (فاتح)', hintBg: '#ffffff', hintText: '#111827', hintBorder: '#e5e7eb' },
  { key: 'dark1', name: 'Dark 1',            hintBg: '#1f2937', hintText: '#ffffff', hintBorder: '#4b5563' },
  { key: 'dark2', name: 'Dark 2',            hintBg: '#1e293b', hintText: '#ffffff', hintBorder: '#475569' },
  { key: 'dark3', name: 'Dark 3',            hintBg: '#18181b', hintText: '#ffffff', hintBorder: '#3f3f46' },
];

export default function UserProfilePage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [theme, setTheme] = useState<ThemeKey>(''); // '' = الوضع الفاتح الافتراضي
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeMsg, setThemeMsg] = useState<string | null>(null);

  // جلب بيانات البروفايل (كما كانت)
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
      } catch (e) {
        setErr('تعذّر جلب بيانات الملف الشخصي');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // قراءة الثيم الحالي من data-theme أو localStorage
  useEffect(() => {
    const el = document.documentElement;
    const fromAttr = (el.getAttribute('data-theme') || '') as ThemeKey;
    const fromStorage = (localStorage.getItem('theme') || '') as ThemeKey;
    const initial = (fromStorage || fromAttr) as ThemeKey;
    applyTheme(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyTheme = (t: ThemeKey) => {
    const el = document.documentElement;
    if (!t) {
      el.removeAttribute('data-theme'); // الوضع الفاتح الافتراضي
    } else {
      el.setAttribute('data-theme', t);
    }
    localStorage.setItem('theme', t);
    setTheme(t);
  };

  const saveThemePref = async (t: ThemeKey) => {
    // تطبيق فوري محليًا
    applyTheme(t);

    // حفظ اختياري على السيرفر (إن كان لديك مسار مخصص)
    // غيّر السطر أدناه لمسارك الفعلي إذا رغبت بحفظ تفضيل الثيم للمستخدم:
    // مثال: await api.post(API_ROUTES.users.savePreferences, { theme: t });
    try {
      setSavingTheme(true);
      setThemeMsg(null);

      // إن لم يكن لديك مسار جاهز، أترك الكتلة التالية معطلة:
      // await api.post(API_ROUTES.users.saveTheme, { theme: t });

      setThemeMsg('✅ تم تطبيق المظهر');
    } catch {
      setThemeMsg('❌ لم يتم حفظ التفضيل على الخادم، لكن تم تطبيقه محليًا');
    } finally {
      setSavingTheme(false);
      // اخفاء الرسالة لاحقًا
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
                      key={t.key || 'light'}
                      type="button"
                      onClick={() => saveThemePref(t.key)}
                      disabled={savingTheme}
                      className={[
                        'group relative flex items-center gap-3 px-3 py-2 rounded-lg border transition',
                        active
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-bg-surface-alt',
                      ].join(' ')}
                      aria-pressed={active}
                    >
                      {/* كرة اللون (معاينة) */}
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
