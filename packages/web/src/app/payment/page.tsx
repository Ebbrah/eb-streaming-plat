"use client";
import { useContext } from 'react';
// import { AuthContext } from '...'; // Uncomment and fix path if you use context
import { useAuth } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

const isTestEnabled = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';

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

  // Only show registration payment form
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
                  await checkAuth();
                  await refreshSubscriptionStatus();
                  router.push('/');
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
        {isTestEnabled && user && (
          <button
            className="w-full py-2 px-4 mt-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={async () => {
              setError(null);
              setLoading(true);
              try {
                await createTestSubscription();
                setLoading(false);
                router.push('/');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to create test subscription');
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Continue without payment (Test)'}
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