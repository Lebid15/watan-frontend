'use client';
import { useState } from 'react';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';
import LoginPasskeyButton from '@/components/LoginPasskeyButton';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await api.post('/auth/login', { emailOrUsername, password }, { validateStatus: () => true });
      if (res.status >= 300) throw new Error((res.data as any)?.message || 'فشل الدخول');
      const token = (res.data as any).token || (res.data as any).access_token;
      localStorage.setItem('token', token);
      document.cookie = `access_token=${token}; Path=/; Max-Age=${60*60*24*7}`;
      router.push('/');
    } catch(e:any){ setError(e?.message || 'فشل'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold">تسجيل الدخول</h1>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">البريد أو اسم المستخدم</label>
          <input className="border w-full rounded px-3 py-2 text-sm" value={emailOrUsername} onChange={e=>setEmailOrUsername(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">كلمة المرور</label>
          <input type="password" className="border w-full rounded px-3 py-2 text-sm" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button disabled={loading || !emailOrUsername || !password} className="bg-sky-600 text-white px-4 py-2 rounded text-sm disabled:opacity-60 w-full">{loading? '...' : 'دخول'}</button>
        {error && <div className="text-xs text-red-600">{error}</div>}
      </form>
      <div className="pt-4 border-t">
        <h2 className="text-sm font-medium mb-2">أو دخول بمفتاح المرور</h2>
        <LoginPasskeyButton onSuccess={()=>router.push('/')} />
      </div>
      <div className="text-xs text-gray-600 space-x-3 rtl:space-x-reverse flex">
        <a href="/password-reset" className="underline">نسيت كلمة المرور؟</a>
        <a href="/verify-email" className="underline">التحقق من البريد</a>
      </div>
    </div>
  );
}
