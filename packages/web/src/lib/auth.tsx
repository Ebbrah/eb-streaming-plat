'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isSuperAdmin: boolean;
  profilePicture?: string;
  level: number;
  experience: number;
  achievements: any[];
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
}

interface SubscriptionStatus {
  status: string;
  hasSubscription: boolean;
  isActive: boolean;
  [key: string]: any;
}

interface AuthContextType {
  // Core auth state
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Core auth functions
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  
  // Subscription state and functions
  subscriptionStatus: SubscriptionStatus | null;
  refreshSubscriptionStatus: () => Promise<void>;
  
  // Test subscription functions (for development)
  createTestSubscription: (plan?: string, durationMinutes?: number) => Promise<any>;
  ensureTestSubscription: () => Promise<void>;
  expireTestSubscription: () => any;
  renewTestSubscription: (plan?: string, durationMinutes?: number) => Promise<any>;
  cancelTestSubscription: () => any;
  clearTestSubscription: () => void;
}

// ============================================================================
// API HELPER FUNCTIONS
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return data;
};

const authenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  return apiRequest(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
};

// ============================================================================
// AUTH CONTEXT PROVIDER
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const router = useRouter();

  // ============================================================================
  // CORE AUTH FUNCTIONS
  // ============================================================================

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setSubscriptionStatus(null);
        setLoading(false);
        return;
      }

      const data = await authenticatedRequest('/api/users/profile');
      if (data.success && data.data) {
        setUser(data.data);
        await refreshSubscriptionStatus();
      } else {
        // Invalid token, clear it
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

  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      console.log('🔄 Starting registration for:', email);
      
      const data = await apiRequest('/api/users/register/user', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      console.log('✅ Registration successful:', data);

      if (!data.success || !data.data?.token || !data.data?.user) {
        throw new Error(data.message || 'Registration failed - invalid response');
      }

      // Store token and user data
      localStorage.setItem('token', data.data.token);
      setUser(data.data.user);
      
      // Refresh subscription status
      await refreshSubscriptionStatus();
      
      console.log('✅ User registered and logged in successfully');
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔄 Starting login for:', email);
      
      const data = await apiRequest('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      console.log('✅ Login successful:', data);

      if (!data.success || !data.data?.token || !data.data?.user) {
        throw new Error(data.message || 'Login failed - invalid response');
      }

      // Store token and user data
      localStorage.setItem('token', data.data.token);
      setUser(data.data.user);
      
      // Refresh subscription status
      await refreshSubscriptionStatus();
      
      console.log('✅ User logged in successfully');
      
      // Handle redirect based on subscription status
      if (subscriptionStatus?.isActive) {
        console.log('✅ User has active subscription, redirecting to home');
        router.push('/');
      } else {
        console.log('⚠️ User has no active subscription, redirecting to payment');
        router.push('/payment?expired=1');
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('🔄 Logging out user');
    localStorage.removeItem('token');
    setUser(null);
    setSubscriptionStatus(null);
    router.push('/');
  };

  // ============================================================================
  // SUBSCRIPTION FUNCTIONS
  // ============================================================================

  const refreshSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSubscriptionStatus(null);
        return;
      }

      // Check if we're in test mode
      const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
      const isBackendTest = process.env.NEXT_PUBLIC_TEST_MODE === 'backend' || 
                           process.env.NEXT_PUBLIC_TEST_MODE === 'hybrid';

      // Frontend-only test mode: use localStorage
      if (isTestMode && !isBackendTest) {
        const testData = localStorage.getItem('testSubscription');
        if (testData) {
          const subscription = JSON.parse(testData);
          setSubscriptionStatus(subscription);
        } else {
          setSubscriptionStatus({
            status: 'inactive',
            hasSubscription: false,
            isActive: false
          });
        }
        return;
      }

      // Backend mode: call API
      const data = await authenticatedRequest('/api/subscriptions/status');
      if (data.success) {
        setSubscriptionStatus(data.data);
      } else {
        setSubscriptionStatus(null);
      }
    } catch (error) {
      console.error('Subscription status error:', error);
      setSubscriptionStatus(null);
    }
  };

  // ============================================================================
  // TEST SUBSCRIPTION FUNCTIONS (FOR DEVELOPMENT)
  // ============================================================================

  const createTestSubscription = async (plan = 'monthly', durationMinutes = 5) => {
    const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
    if (!isTestMode) {
      throw new Error('Test mode is not enabled');
    }

    const isBackendTest = process.env.NEXT_PUBLIC_TEST_MODE === 'backend' || 
                         process.env.NEXT_PUBLIC_TEST_MODE === 'hybrid';

    if (isBackendTest) {
      // Use backend API
      const data = await authenticatedRequest('/api/subscriptions/test-create', {
        method: 'POST',
        body: JSON.stringify({
          plan,
          durationMinutes,
          testMode: true
        }),
      });
      
      if (data.success) {
        await refreshSubscriptionStatus();
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create test subscription');
      }
    } else {
      // Frontend-only mode
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      
      const testSubscription = {
        id: `test_${Date.now()}`,
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

      localStorage.setItem('testSubscription', JSON.stringify(testSubscription));
      setSubscriptionStatus(testSubscription);
      
      return testSubscription;
    }
  };

  const ensureTestSubscription = async () => {
    const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
    const disableAutoCreation = process.env.NEXT_PUBLIC_DISABLE_AUTO_SUBSCRIPTION === 'true';
    
    if (!isTestMode || disableAutoCreation) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const isBackendTest = process.env.NEXT_PUBLIC_TEST_MODE === 'backend' || 
                         process.env.NEXT_PUBLIC_TEST_MODE === 'hybrid';

    if (isBackendTest) {
      try {
        const statusData = await authenticatedRequest('/api/subscriptions/status');
        
        if (!statusData.success || !statusData.data || statusData.data.status !== 'active') {
          console.log('Creating test subscription...');
          await createTestSubscription('monthly', 5);
        }
      } catch (error) {
        console.error('Error ensuring test subscription:', error);
      }
    }
  };

  const expireTestSubscription = () => {
    const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
    if (!isTestMode) {
      throw new Error('Test mode not enabled');
    }

    const testData = localStorage.getItem('testSubscription');
    if (testData) {
      const subscription = JSON.parse(testData);
      subscription.status = 'expired';
      subscription.isActive = false;
      subscription.endDate = new Date(Date.now() - 1000).toISOString();
      
      localStorage.setItem('testSubscription', JSON.stringify(subscription));
      setSubscriptionStatus(subscription);
      
      return subscription;
    }
  };

  const renewTestSubscription = async (plan = 'monthly', durationMinutes = 5) => {
    return await createTestSubscription(plan, durationMinutes);
  };

  const cancelTestSubscription = () => {
    const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';
    if (!isTestMode) {
      throw new Error('Test mode not enabled');
    }

    const testData = localStorage.getItem('testSubscription');
    if (testData) {
      const subscription = JSON.parse(testData);
      subscription.status = 'cancelled';
      subscription.isActive = false;
      subscription.autoRenew = false;
      
      localStorage.setItem('testSubscription', JSON.stringify(subscription));
      setSubscriptionStatus(subscription);
      
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
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    checkAuth();
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    register,
    login,
    logout,
    checkAuth,
    subscriptionStatus,
    refreshSubscriptionStatus,
    createTestSubscription,
    ensureTestSubscription,
    expireTestSubscription,
    renewTestSubscription,
    cancelTestSubscription,
    clearTestSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
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