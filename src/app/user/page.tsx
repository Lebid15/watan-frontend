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
  countryCode?: string | null; // مثل +90
  phone?: string | null;       // مثل 5xxxxxxxxx
};

export default function UserProfilePage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

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

    // fallback: جلب من الـ API مباشرة
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get<Profile>(
          // إن كان عندك مسار خاص مع العملة استخدمه، وإلا يبقى profile
          (API_ROUTES.users as any).profileWithCurrency || API_ROUTES.users.profile
        );
        setProfile(data);
      } catch (e: any) {
        setErr('تعذّر جلب بيانات الملف الشخصي');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const fullName =
    profile?.fullName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    '';

  const phoneDisplay = [profile?.countryCode, profile?.phone].filter(Boolean).join(' ');

  return (
    <div className="min-h-[70vh] flex items-start justify-center p-4">
      <div
        className="w-full max-w-lg rounded-2xl p-6 shadow"
        style={{
          background: 'var(--bg-section)',
          boxShadow: 'var(--shadow-1)',
        }}
      >
        <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-main)' }}>
          الملف الشخصي
        </h1>

        {loading && (
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            جاري تحميل البيانات...
          </div>
        )}

        {err && (
          <div className="mb-4 text-sm" style={{ color: 'var(--danger)' }}>
            {err}
          </div>
        )}

        {!loading && profile && (
          <div className="space-y-4">
            {/* الاسم والكنية */}
            <div>
              <label className="block mb-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                الاسم والكنية
              </label>
              <input
                type="text"
                value={fullName}
                disabled
                className="w-full rounded-lg px-3 py-2 text-sm border"
                style={{
                  background: 'transparent',
                  color: 'var(--text-main)',
                  borderColor: 'var(--border-subtle)',
                }}
              />
            </div>

            {/* البريد الإلكتروني */}
            <div>
              <label className="block mb-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={profile.email || ''}
                disabled
                className="w-full rounded-lg px-3 py-2 text-sm border"
                style={{
                  background: 'transparent',
                  color: 'var(--text-main)',
                  borderColor: 'var(--border-subtle)',
                }}
              />
            </div>

            {/* اسم المستخدم */}
            <div>
              <label className="block mb-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                اسم المستخدم
              </label>
              <input
                type="text"
                value={profile.username || ''}
                disabled
                className="w-full rounded-lg px-3 py-2 text-sm border"
                style={{
                  background: 'transparent',
                  color: 'var(--text-main)',
                  borderColor: 'var(--border-subtle)',
                }}
              />
            </div>

            {/* رقم الجوال مع النداء */}
            <div>
              <label className="block mb-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                رقم الجوال (مع النداء)
              </label>
              <input
                type="text"
                value={phoneDisplay}
                disabled
                className="w-full rounded-lg px-3 py-2 text-sm border"
                style={{
                  background: 'transparent',
                  color: 'var(--text-main)',
                  borderColor: 'var(--border-subtle)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
