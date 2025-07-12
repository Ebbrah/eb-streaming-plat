import { API_URL, TEST_MODE } from '../config';

class TestSubscriptionService {
  static async createTestSubscription(token, plan = 'monthly', durationMinutes = 5) {
    if (!TEST_MODE.ENABLED) {
      throw new Error('Test mode is not enabled');
    }

    try {
      const response = await fetch(`${API_URL}/subscriptions/test-create`, {
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
        console.log('[MOBILE TEST] Test subscription created:', data.data);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create test subscription');
      }
    } catch (error) {
      console.error('[MOBILE TEST] Error creating test subscription:', error);
      throw error;
    }
  }

  static async getTestSubscriptionStatus(token) {
    if (!TEST_MODE.ENABLED) {
      throw new Error('Test mode is not enabled');
    }

    try {
      const response = await fetch(`${API_URL}/subscriptions/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('[MOBILE TEST] Subscription status:', data.data);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get subscription status');
      }
    } catch (error) {
      console.error('[MOBILE TEST] Error getting subscription status:', error);
      throw error;
    }
  }

  static async expireTestSubscription(token) {
    if (!TEST_MODE.ENABLED) {
      throw new Error('Test mode is not enabled');
    }

    try {
      // For mobile, we'll simulate expiration by updating the subscription
      const response = await fetch(`${API_URL}/subscriptions/test-expire`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('[MOBILE TEST] Test subscription expired:', data.data);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to expire test subscription');
      }
    } catch (error) {
      console.error('[MOBILE TEST] Error expiring test subscription:', error);
      throw error;
    }
  }

  static async renewTestSubscription(token, plan = 'monthly', durationMinutes = 5) {
    if (!TEST_MODE.ENABLED) {
      throw new Error('Test mode is not enabled');
    }

    return await this.createTestSubscription(token, plan, durationMinutes);
  }

  static async cancelTestSubscription(token) {
    if (!TEST_MODE.ENABLED) {
      throw new Error('Test mode is not enabled');
    }

    try {
      const response = await fetch(`${API_URL}/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('[MOBILE TEST] Test subscription cancelled:', data.data);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to cancel test subscription');
      }
    } catch (error) {
      console.error('[MOBILE TEST] Error cancelling test subscription:', error);
      throw error;
    }
  }

  // Helper method to check if test mode is enabled
  static isTestModeEnabled() {
    return TEST_MODE.ENABLED;
  }

  // Helper method to get test configuration
  static getTestConfig() {
    return TEST_MODE;
  }
}

export default TestSubscriptionService; 