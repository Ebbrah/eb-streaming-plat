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
  checkAuth: () => Promise<void>;
  // Test subscription management functions
  createTestSubscription: (plan?: string, durationMinutes?: number) => Promise<any>;
  ensureTestSubscription: () => Promise<void>;
  expireTestSubscription: () => any;
  renewTestSubscription: (plan?: string, durationMinutes?: number) => Promise<any>;
  cancelTestSubscription: () => any;
  clearTestSubscription: () => void;
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

  // Test subscription management functions
  const createTestSubscription = async (plan = 'monthly', durationMinutes = 5) => {
    const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
    if (!isTestMode) {
      throw new Error('Test mode is not enabled');
    }

    const currentUser = user || pendingRegistration;
    const userId = currentUser?.id;

    // Check if we should use backend test mode
    const isBackendTest = process.env.NEXT_PUBLIC_TEST_MODE === 'backend' || 
                         process.env.NEXT_PUBLIC_TEST_MODE === 'hybrid';

    if (isBackendTest) {
      // Use backend API for test subscription
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/test-create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan,
            durationMinutes,
            testMode: true
          }),
        });

        const data = await response.json();
        if (data.success) {
          console.log('[BACKEND TEST MODE] Test subscription created:', data.data);
          await refreshSubscriptionStatus(); // Refresh from backend
          return data.data;
        } else {
          throw new Error(data.message || 'Failed to create test subscription');
        }
      } catch (error) {
        console.error('[BACKEND TEST MODE] Error creating test subscription:', error);
        throw error;
      }
    } else {
      // Frontend-only test mode
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      
      const testSubscription = {
        id: `test_${userId || Date.now()}`,
        userId: userId,
        status: 'active',
        plan: plan,
        paymentMethod: 'test',
        paymentStatus: 'completed',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        hasSubscription: true,
        isActive: true,
        autoRenew: true
      };

      // Store user-specific test data
      if (userId) {
        localStorage.setItem(`testSubscription_${userId}`, JSON.stringify(testSubscription));
      } else {
        localStorage.setItem('testSubscription', JSON.stringify(testSubscription));
      }
      
      setSubscriptionStatus(testSubscription);
      
      console.log('[FRONTEND TEST MODE] Test subscription created:', testSubscription);
      return testSubscription;
    }
  };

  // NEW: Pre-create test subscription before auth checks
  const ensureTestSubscription = async () => {
    const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
    const disableAutoCreation = process.env.NEXT_PUBLIC_DISABLE_AUTO_SUBSCRIPTION === 'true';
    
    console.log('[ENSURE] Debug - isTestMode:', isTestMode, 'disableAutoCreation:', disableAutoCreation);
    
    if (!isTestMode || disableAutoCreation) {
      console.log('[ENSURE] Skipping auto-creation - isTestMode:', isTestMode, 'disableAutoCreation:', disableAutoCreation);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const isBackendTest = process.env.NEXT_PUBLIC_TEST_MODE === 'backend' || 
                         process.env.NEXT_PUBLIC_TEST_MODE === 'hybrid';

    if (isBackendTest) {
      try {
        // Check if subscription already exists
        const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const statusData = await statusResponse.json();
        
        // If no active subscription, create one
        if (!statusData.success || !statusData.data || statusData.data.status !== 'active') {
          console.log('[PRE-CREATE] No active subscription found, creating test subscription...');
          await createTestSubscription('monthly', 5);
        }
      } catch (error) {
        console.error('[PRE-CREATE] Error ensuring test subscription:', error);
      }
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSubscriptionStatus(null);
        return;
      }

      // Check if we should use backend test mode
      const isBackendTest = process.env.NEXT_PUBLIC_TEST_MODE === 'backend' || 
                           process.env.NEXT_PUBLIC_TEST_MODE === 'hybrid';
      
      // Frontend-only test mode: bypass backend subscription check
      const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
      if (isTestMode && !isBackendTest) {
        // Get test subscription data from localStorage
        const testSubscriptionData = localStorage.getItem('testSubscription');
        if (testSubscriptionData) {
          const subscription = JSON.parse(testSubscriptionData);
          console.log('[TEST MODE] Using stored test subscription:', subscription);
          setSubscriptionStatus(subscription);
        } else {
          console.log('[TEST MODE] No test subscription found, setting to inactive');
          setSubscriptionStatus({
            status: 'inactive',
            hasSubscription: false,
            isActive: false
          });
        }
        return;
      }

      // Backend test mode or production: call backend API
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

  const expireTestSubscription = () => {
    const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
    if (!isTestMode) {
      throw new Error('Test mode not enabled');
    }

    const testSubscriptionData = localStorage.getItem('testSubscription');
    if (testSubscriptionData) {
      const subscription = JSON.parse(testSubscriptionData);
      subscription.status = 'expired';
      subscription.isActive = false;
      subscription.endDate = new Date(Date.now() - 1000).toISOString(); // Set to past
      
      localStorage.setItem('testSubscription', JSON.stringify(subscription));
      setSubscriptionStatus(subscription);
      
      console.log('[TEST MODE] Test subscription expired:', subscription);
      return subscription;
    }
  };

  const renewTestSubscription = async (plan = 'monthly', durationMinutes = 5) => {
    const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
    if (!isTestMode) {
      throw new Error('Test mode not enabled');
    }

    return await createTestSubscription(plan, durationMinutes);
  };

  const cancelTestSubscription = () => {
    const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
    if (!isTestMode) {
      throw new Error('Test mode not enabled');
    }

    const testSubscriptionData = localStorage.getItem('testSubscription');
    if (testSubscriptionData) {
      const subscription = JSON.parse(testSubscriptionData);
      subscription.status = 'cancelled';
      subscription.isActive = false;
      subscription.autoRenew = false;
      
      localStorage.setItem('testSubscription', JSON.stringify(subscription));
      setSubscriptionStatus(subscription);
      
      console.log('[TEST MODE] Test subscription cancelled:', subscription);
      return subscription;
    }
  };

  const clearTestSubscription = () => {
    localStorage.removeItem('testSubscription');
    setSubscriptionStatus({
      status: 'inactive',
      hasSubscription: false,
      isActive: false
    });
    console.log('[TEST MODE] Test subscription cleared');
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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, completeRegistration, logout, loading, subscriptionStatus, refreshSubscriptionStatus, pendingRegistration, pendingRegistrationForm, setPendingRegistrationForm, checkAuth, createTestSubscription, ensureTestSubscription, expireTestSubscription, renewTestSubscription, cancelTestSubscription, clearTestSubscription }}>
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