'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { API_ROUTES } from '@/utils/api';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  balance: number;
  currency: string;
};

type UserContextType = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    // تجنّب محاولة الجلب أثناء صفحة تسجيل الدخول عندما لا يوجد توكن
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    // لا نجلب أبداً أثناء التواجد في /login لتفادي أي 401 تشويشية أو سباق قبل إعادة التوجيه
    if (path === '/login') {
      setUser(null);
      setLoading(false);
      return;
    }

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // جلب البيانات الشخصية فقط إذا كان التوكن موجودًا
      const res = await api.get<User>(API_ROUTES.users.profileWithCurrency, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setUser(res.data);
    } catch (e: any) {
      // عند 401: لا نمسح التوكن أثناء التواجد في مناطق backoffice (/admin أو /dev) حتى لا نطرد المستخدم بسبب 401 عابر
      if (e?.response?.status === 401 && typeof window !== 'undefined') {
        const p = window.location.pathname || '';
        const inBackoffice = p.startsWith('/admin') || p.startsWith('/dev');
        const onAuthPages = p === '/login' || p === '/register';
        if (!inBackoffice && !onAuthPages) {
          // فقط في الصفحات العامة نمسح التوكن ونوجه المستخدم لتسجيل الدخول لاحقًا (التحويل يتم في interceptor)
          localStorage.removeItem('token');
          document.cookie = 'access_token=; Max-Age=0; path=/';
          document.cookie = 'role=; Max-Age=0; path=/';
        } else {
          // سجل للتشخيص بدون حذف التوكن
          // tslint:disable-next-line:no-console
          console.warn('[UserContext] 401 ignored in backoffice to avoid forced logout');
        }
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userCurrencyCode');
      document.cookie = 'access_token=; Max-Age=0; path=/';
      document.cookie = 'role=; Max-Age=0; path=/';
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
