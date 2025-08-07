// src/context/UserContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { API_ROUTES } from '@/utils/api';

interface User {
  id: string;
  email: string;
  role: string;
  balance: string;
  fullName?: string;
  phoneNumber?: string;
  priceGroupId?: string | null;
  priceGroupName?: string | null;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>; // ✅ الدالة الجديدة
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // ✅ تحميل بيانات المستخدم من localStorage إذا كانت موجودة
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // ✅ دالة جلب البيانات من API وتحديث السياق و localStorage
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get<User>(API_ROUTES.users.profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = res.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('فشل تحديث بيانات المستخدم', err);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};
