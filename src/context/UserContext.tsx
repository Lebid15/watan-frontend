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
    } catch {
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
