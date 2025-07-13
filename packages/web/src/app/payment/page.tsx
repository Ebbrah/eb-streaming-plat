"use client";
import { useContext } from 'react';
// import { AuthContext } from '...'; // Uncomment and fix path if you use context
import { useAuth } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

const isTestEnabled = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';

function PaymentPage() {
  const { user, logout, subscriptionStatus, refreshSubscriptionStatus, checkAuth, createTestSubscription, ensureTestSubscription } = useAuth();
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

  // Single payment screen for all cases
  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: '#6A0DAD' }}>
          Choose Payment Method
        </h2>
        <p className="text-center text-gray-600 mb-4">
          {expired
            ? 'Your subscription has expired. Please renew to continue.'
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
            disabled={true} // Disabled for demo
            onClick={() => {
              alert('Payment is currently disabled.');
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
              // WARNING: Allowing unauthenticated test subscription creation (for testing only)
              await createTestSubscription();
              await refreshSubscriptionStatus();
              router.push('/');
            } catch (err) {
              let errorMsg = 'Network error during subscription';
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

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentPage />
    </Suspense>
  );
} 