"use client";
import { useContext } from 'react';
// import { AuthContext } from '...'; // Uncomment and fix path if you use context
import { useAuth } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const isTestEnabled = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';

function createTestSubscription(token: string, onSuccess: () => void, onError: (msg: string) => void) {
  fetch('/api/subscription/test-create', {
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

export default function PaymentPage() {
  const { user, logout, subscriptionStatus, refreshSubscriptionStatus } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expired = searchParams.get('expired') === '1';

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handleRenew = async () => {
    setError(null);
    setLoading(true);
    // For demo, use test subscription
    if (user && isTestEnabled) {
      createTestSubscription(
        (user as any).token,
        async () => {
          await refreshSubscriptionStatus();
          router.push('/');
        },
        (msg) => setError(msg)
      );
    } else {
      // TODO: Integrate real payment logic here
      setError('Real payment not implemented');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {expired ? (
          <>
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
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
} 