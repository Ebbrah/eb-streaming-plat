'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Preferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

interface Achievement {
  name: string;
  description: string;
  unlockedAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isSuperAdmin: boolean;
  profilePicture?: string;
  level: number;
  experience: number;
  achievements: Achievement[];
  preferences: Preferences;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  completeRegistration: () => Promise<void>;
  logout: () => void;
  loading: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  refreshSubscriptionStatus: () => Promise<void>;
  pendingRegistration: PendingRegistration | null;
  pendingRegistrationForm: PendingRegistrationForm | null;
  setPendingRegistrationForm: (form: PendingRegistrationForm | null) => void;
  checkAuth: () => Promise<void>; // <-- Add this line
}

interface SubscriptionStatus {
  status: string;
  [key: string]: any;
}

interface PendingRegistration {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
  token: string;
}

interface PendingRegistrationForm {
  name: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
  const [pendingRegistrationForm, setPendingRegistrationForm] = useState<PendingRegistrationForm | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Debug: log when checkAuth runs and what token is found
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] checkAuth called. Token in localStorage:', localStorage.getItem('token'));
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setSubscriptionStatus(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.data);
        await refreshSubscriptionStatus();
      } else {
        localStorage.removeItem('token');
        setUser(null);
        setSubscriptionStatus(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      setUser(null);
      setSubscriptionStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSubscriptionStatus(null);
        return;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSubscriptionStatus(data.data);
      } else {
        setSubscriptionStatus(null);
      }
    } catch (error) {
      setSubscriptionStatus(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', { status: response.status, success: data.success });

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        setUser(data.data.user);
        await refreshSubscriptionStatus();
        if (!data.data.user || !data.data.token) {
          throw new Error('Invalid login response');
        }
        // Check subscription status and redirect
        if (!data.data.user || !data.data.token) return;
        const subResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/status`, {
          headers: { 'Authorization': `Bearer ${data.data.token}` },
        });
        const subData = await subResp.json();
        if (!subData.success || !subData.data || subData.data.status !== 'active') {
          router.push('/payment?expired=1');
        } else {
          router.push('/');
        }
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('An unexpected error occurred during login');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      console.log('Auth: Starting registration for:', email);
      const response = await fetch('/api/users/register/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      console.log('Auth: Registration response:', { status: response.status, success: data.success });
      
      if (data.success && data.data && data.data.token && data.data.user) {
        // Store registration data with token but don't log in yet
        const pendingUser: PendingRegistration = {
          id: data.data.user.id,
          email: data.data.user.email,
          name: data.data.user.name,
          role: data.data.user.role,
          isSuperAdmin: data.data.user.isSuperAdmin || false,
          token: data.data.token
        };
        setPendingRegistration(pendingUser);
        return data;
      } else {
        console.error('Auth: Registration failed - invalid response structure:', data);
        throw new Error(data.message || 'Registration failed - invalid response');
      }
    } catch (error) {
      console.error('Auth: Registration error:', error);
      throw error;
    }
  };

  const completeRegistration = async () => {
    if (pendingRegistration) {
      // Set user and token, clear pendingRegistration
      localStorage.setItem('token', pendingRegistration.token);
      // Optionally fetch user profile for full info
      setUser({
        id: pendingRegistration.id,
        email: pendingRegistration.email,
        name: pendingRegistration.name,
        role: pendingRegistration.role as any,
        isSuperAdmin: pendingRegistration.isSuperAdmin,
        profilePicture: '',
        level: 0,
        experience: 0,
        achievements: [],
        preferences: { theme: 'light', notifications: true, language: 'en' },
      });
      setPendingRegistration(null);
      await refreshSubscriptionStatus();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSubscriptionStatus(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, completeRegistration, logout, loading, subscriptionStatus, refreshSubscriptionStatus, pendingRegistration, pendingRegistrationForm, setPendingRegistrationForm, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 