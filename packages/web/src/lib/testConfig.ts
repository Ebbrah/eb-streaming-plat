// Test Configuration for Subscription System
// This file centralizes all test-related settings

export const TEST_CONFIG = {
  // Enable/disable test mode
  ENABLED: process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true',
  
  // Test mode type: 'frontend-only' | 'backend' | 'hybrid'
  MODE: process.env.NEXT_PUBLIC_TEST_MODE || 'hybrid',
  
  // Test subscription settings
  SUBSCRIPTION: {
    DEFAULT_DURATION_MINUTES: 5,
    DEFAULT_PLAN: 'monthly',
    FAILURE_RATE: 0.05, // 5% chance of failure for testing
    API_DELAY_MS: 1000, // Simulate API delay
  },
  
  // Test payment settings
  PAYMENT: {
    METHODS: ['test', 'mpesa', 'mix'],
    DEFAULT_AMOUNT: 5.99,
    CURRENCY: 'USD',
  },
  
  // Test user settings
  USER: {
    DEFAULT_ROLE: 'user',
    TEST_EMAIL_DOMAIN: '@test.com',
  },
  
  // Feature flags
  FEATURES: {
    SHOW_TEST_DASHBOARD: true,
    ALLOW_MANUAL_EXPIRATION: true,
    ALLOW_MANUAL_RENEWAL: true,
    ALLOW_MANUAL_CANCELLATION: true,
    SIMULATE_PAYMENT_FAILURES: true,
    USE_BACKEND_FOR_TEST: true, // Enable backend testing
  },
  
  // UI settings
  UI: {
    DASHBOARD_POSITION: 'bottom-right',
    SHOW_TEST_INDICATOR: true,
    TEST_COLOR: '#10B981', // Green
  }
};

// Helper functions for test mode
export const isTestMode = () => TEST_CONFIG.ENABLED;

export const isBackendTestMode = () => 
  TEST_CONFIG.ENABLED && 
  (TEST_CONFIG.MODE === 'backend' || TEST_CONFIG.MODE === 'hybrid');

export const isFrontendOnlyTestMode = () => 
  TEST_CONFIG.ENABLED && TEST_CONFIG.MODE === 'frontend-only';

export const getTestSubscriptionDuration = () => 
  TEST_CONFIG.SUBSCRIPTION.DEFAULT_DURATION_MINUTES;

export const getTestPlan = () => TEST_CONFIG.SUBSCRIPTION.DEFAULT_PLAN;

export const shouldSimulateFailure = () => 
  Math.random() < TEST_CONFIG.SUBSCRIPTION.FAILURE_RATE;

export const getApiDelay = () => TEST_CONFIG.SUBSCRIPTION.API_DELAY_MS;

// Test data generators
export const generateTestSubscription = (plan = 'monthly', durationMinutes = 5, userId?: string) => {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  
  return {
    id: `test_${userId || Date.now()}`,
    userId: userId,
    status: 'active',
    plan,
    paymentMethod: 'test',
    paymentStatus: 'completed',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    hasSubscription: true,
    isActive: true,
    autoRenew: true,
    testMode: true,
    testCreatedAt: new Date().toISOString(),
    testDuration: `${durationMinutes} minutes`
  };
};

// Test mode validation
export const validateTestMode = () => {
  if (!isTestMode()) {
    throw new Error('Test mode is not enabled. Set NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS=true');
  }
};

// Production mode validation
export const validateProductionMode = () => {
  if (isTestMode()) {
    console.warn('⚠️ Running in test mode. Set NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS=false for production.');
  }
};

// Test utilities
export const testUtils = {
  // Clear all test data
  clearAllTestData: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('testSubscription');
      localStorage.removeItem('testUser');
      localStorage.removeItem('testPayment');
    }
  },
  
  // Get test data
  getTestData: () => {
    if (typeof window !== 'undefined') {
      return {
        subscription: localStorage.getItem('testSubscription'),
        user: localStorage.getItem('testUser'),
        payment: localStorage.getItem('testPayment')
      };
    }
    return {};
  },
  
  // Set test data
  setTestData: (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  },

  // Get user-specific test data key
  getUserTestKey: (userId: string) => `testSubscription_${userId}`,
  
  // Set user-specific test data
  setUserTestData: (userId: string, data: any) => {
    if (typeof window !== 'undefined') {
      const key = testUtils.getUserTestKey(userId);
      localStorage.setItem(key, JSON.stringify(data));
    }
  },
  
  // Get user-specific test data
  getUserTestData: (userId: string) => {
    if (typeof window !== 'undefined') {
      const key = testUtils.getUserTestKey(userId);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }
}; 