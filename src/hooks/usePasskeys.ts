'use client';
import { useState, useCallback } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import api, { API_ROUTES } from '@/utils/api';

export function usePasskeys() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerPasskey = useCallback(async (label?: string) => {
    setError(null); setLoading(true);
    try {
      const { data: options } = await api.post(API_ROUTES.auth.passkeys.regOptions, { label });
      const attResp = await startRegistration(options);
      const verifyRes = await api.post(API_ROUTES.auth.passkeys.regVerify, attResp, { validateStatus: () => true });
      if (verifyRes.status >= 300) throw new Error((verifyRes.data as any)?.message || 'فشل التحقق');
      return verifyRes.data;
    } catch (e: any) {
      setError(e?.message || 'خطأ في إنشاء Passkey');
      throw e;
    } finally { setLoading(false); }
  }, []);

  const authenticateWithPasskey = useCallback(async () => {
    setError(null); setLoading(true);
    try {
      const { data: options } = await api.post(API_ROUTES.auth.passkeys.authOptions, {});
      const authResp = await startAuthentication(options);
  const verifyRes = await api.post<any>(API_ROUTES.auth.passkeys.authVerify, authResp, { validateStatus: () => true });
  if (verifyRes.status >= 300 || !(verifyRes.data as any)?.token) throw new Error((verifyRes.data as any)?.message || 'فشل تسجيل الدخول');
  const token = (verifyRes.data as any).token as string;
      localStorage.setItem('token', token);
      document.cookie = `access_token=${token}; Path=/; Max-Age=${60*60*24*7}`;
      return verifyRes.data;
    } catch (e: any) {
      setError(e?.message || 'خطأ في تسجيل الدخول بـ Passkey');
      throw e;
    } finally { setLoading(false); }
  }, []);

  return { registerPasskey, authenticateWithPasskey, loading, error };
}
