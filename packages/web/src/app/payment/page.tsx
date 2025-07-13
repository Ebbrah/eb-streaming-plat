"use client";
import { useContext } from 'react';
// import { AuthContext } from '...'; // Uncomment and fix path if you use context
import { useAuth } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

const isTestEnabled = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';

function createTestSubscription(token: string, onSuccess: () => void, onError: (msg: string) => void) {
  fetch('/api/subscriptions/test-create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Test subscription created!');
        onSuccess();
      } else {
        onError(data.message || 'Failed to create test subscription');
      }
    })
    .catch(() => onError('Network error'));
}

function PaymentPage() {
  const { user, logout, subscriptionStatus, refreshSubscriptionStatus, pendingRegistration, completeRegistration, pendingRegistrationForm, setPendingRegistrationForm, checkAuth, createTestSubscription, ensureTestSubscription } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const expired = searchParams.get('expired') === '1';

  const PAYMENT_PROVIDERS = [
    {
      id: 'mpesa',
      name: 'M-PESA',
      description: 'Pay using M-PESA mobile money',
      icon: '📱',
    },
    {
      id: 'mix',
      name: 'Mix Payment',
      description: 'Pay using credit/debit card',
      icon: '💳',
    },
  ];

  useEffect(() => {
    if (!user && !pendingRegistration && !pendingRegistrationForm) {
      router.push('/auth/login');
    }
  }, [user, pendingRegistration, pendingRegistrationForm, router]);

  const handleRenew = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const disableAutoCreation = process.env.NEXT_PUBLIC_DISABLE_AUTO_SUBSCRIPTION === 'true';
      if (isTestEnabled && !disableAutoCreation) {
        // Use the new pre-creation approach to avoid race conditions
        await ensureTestSubscription();
        await refreshSubscriptionStatus();
        if (pendingRegistration) {
          await completeRegistration();
        }
        router.push('/');
      } else {
        // TODO: Integrate real payment logic here
        setError('Real payment not implemented');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    logout();
  };

  // If in registration flow, always show payment form
  if (pendingRegistrationForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: '#6A0DAD' }}>
            Choose Payment Method
          </h2>
          <p className="text-center text-gray-600 mb-4">
            {pendingRegistrationForm.name
              ? `Complete your registration, ${pendingRegistrationForm.name}!`
              : 'Select your preferred payment method'}
          </p>
          <input
            type="tel"
            className="w-full px-4 py-2 border rounded mb-4"
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            disabled={loading}
          />
          {PAYMENT_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              className="w-full flex items-center justify-between py-3 px-4 mb-3 border border-gray-300 rounded hover:bg-purple-50"
              disabled={loading || !phoneNumber}
              onClick={async () => {
                setError(null);
                setLoading(true);
                setTimeout(async () => {
                  try {
                    const response = await fetch('/api/users/register/user', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...pendingRegistrationForm, phoneNumber }),
                    });
                    const data = await response.json();
                    if (data.success && data.data && data.data.token && data.data.user) {
                      localStorage.setItem('token', data.data.token);
                      setPendingRegistrationForm(null);
                      router.push('/');
                    } else {
                      setError(data.message || 'Registration failed after payment');
                    }
                  } catch (err) {
                    setError('Network error during registration');
                  }
                  setLoading(false);
                }, 1200);
              }}
            >
              <span className="text-2xl mr-3">{provider.icon}</span>
              <span className="flex-1 text-left">
                <span className="font-bold">{provider.name}</span>
                <span className="block text-xs text-gray-500">{provider.description}</span>
              </span>
            </button>
          ))}
          <button
            className="w-full py-2 px-4 mt-4 border border-transparent text-sm font-medium rounded-md text-white"
            style={{ backgroundColor: '#6A0DAD' }}
            onClick={async () => {
              setError(null);
              setLoading(true);
              try {
                // 1. Register user and get token
                const response = await fetch('/api/users/register/user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...pendingRegistrationForm, phoneNumber }),
                });
                const data = await response.json();
                if (data.success && data.data && data.data.token && data.data.user) {
                  const token = data.data.token;
                  localStorage.setItem('token', token);
                  setPendingRegistrationForm(null);
                  await completeRegistration();
                  await checkAuth(); // Ensure AuthContext is updated
                  
                  // 2. Use the new pre-creation approach to avoid race conditions
                  const disableAutoCreation = process.env.NEXT_PUBLIC_DISABLE_AUTO_SUBSCRIPTION === 'true';
                  if (isTestEnabled && !disableAutoCreation) {
                    console.log('Test mode enabled - ensuring test subscription exists...');
                    try {
                      // Pre-create subscription before redirect
                      await ensureTestSubscription();
                      console.log('Test subscription ensured, redirecting to home...');
                      router.push('/');
                    } catch (error) {
                      console.error('Test subscription creation failed:', error);
                      setError('Failed to create test subscription');
                    }
                  } else {
                    // 3. Call test subscription endpoint with better error handling
                    let testSubscriptionSuccess = false;
                    try {
                      console.log('Creating test subscription with token:', token.substring(0, 20) + '...');
                      const testResponse = await fetch('/api/subscriptions/test-create', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                      });
                      
                      const testData = await testResponse.json();
                      console.log('Test subscription response:', testData);
                      
                      if (testData.success) {
                        console.log('Test subscription created successfully');
                        testSubscriptionSuccess = true;
                      } else {
                        console.warn('Test subscription failed:', testData.message);
                        testSubscriptionSuccess = false;
                      }
                    } catch (err) {
                      console.error('Test subscription error:', err);
                      testSubscriptionSuccess = false;
                    }
                    
                    // 4. Redirect based on test subscription result
                    if (testSubscriptionSuccess) {
                      console.log('Registration and test subscription completed, redirecting to home...');
                      router.push('/');
                    } else {
                      console.log('Test subscription failed, redirecting to payment with expired status...');
                      router.push('/payment?expired=1');
                    }
                  }
                } else {
                  setError(data.message || (data.errors && JSON.stringify(data.errors)) || 'Registration failed after payment');
                }
              } catch (err) {
                let errorMsg = 'Network error during registration';
                if (err && typeof err === 'object' && 'message' in err) {
                  errorMsg = (err as any).message;
                } else if (typeof err === 'string') {
                  errorMsg = err;
                }
                setError(errorMsg);
              }
              setLoading(false);
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Continue without payment'}
          </button>
          {loading && (
            <div className="flex justify-center mt-4">
              <span className="loader" /> Processing payment...
            </div>
          )}
          {error && <div className="text-red-500 text-center mt-2">{error}</div>}
        </div>
      </div>
    );
  }

  // Only show expired UI if user is authenticated and subscription is expired
  if (user && expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Subscription Expired
          </h2>
          <p className="text-center text-gray-600 mb-4">
            Your subscription has expired. Please renew to continue enjoying premium content.
          </p>
          {error && <div className="text-red-500 text-center mb-2">{error}</div>}
          <button
            className="w-full py-2 px-4 mb-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            onClick={handleRenew}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Renew Subscription'}
          </button>
          <button
            className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel / Logout
          </button>
          {isTestEnabled && (
            <button
              className="w-full py-2 px-4 mt-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={handleRenew}
              disabled={loading}
            >
              Continue without payment (Test)
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default: show payment form for authenticated users (not expired)
  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Payment
        </h2>
        <p className="text-center text-gray-600 mb-4">
          Please complete your payment to activate your subscription.
        </p>
        {/* TODO: Add real payment form here */}
        {isTestEnabled && (
          <button
            className="w-full py-2 px-4 mt-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={handleRenew}
            disabled={loading}
          >
            Continue without payment (Test)
          </button>
        )}
        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
      </div>
    </div>
  );
}

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentPage />
    </Suspense>
  );
} 