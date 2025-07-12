'use client';

import { useAuth } from '@/lib/auth';
import { useState } from 'react';

export default function TestSubscriptionDashboard() {
  const { 
    subscriptionStatus, 
    createTestSubscription, 
    expireTestSubscription, 
    renewTestSubscription, 
    cancelTestSubscription, 
    clearTestSubscription 
  } = useAuth();
  
  const [duration, setDuration] = useState(5);
  const [plan, setPlan] = useState('monthly');
  const [testMode, setTestMode] = useState(process.env.NEXT_PUBLIC_TEST_MODE || 'hybrid');

  const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';

  if (!isTestMode) {
    return null; // Only show in test mode
  }

  const handleCreateSubscription = async () => {
    try {
      await createTestSubscription(plan, duration);
    } catch (error) {
      console.error('Failed to create test subscription:', error);
    }
  };

  const handleExpireSubscription = () => {
    try {
      expireTestSubscription();
    } catch (error) {
      console.error('Failed to expire test subscription:', error);
    }
  };

  const handleRenewSubscription = async () => {
    try {
      await renewTestSubscription(plan, duration);
    } catch (error) {
      console.error('Failed to renew test subscription:', error);
    }
  };

  const handleCancelSubscription = () => {
    try {
      cancelTestSubscription();
    } catch (error) {
      console.error('Failed to cancel test subscription:', error);
    }
  };

  const handleClearSubscription = () => {
    clearTestSubscription();
  };

  const getTestModeColor = (mode: string) => {
    switch (mode) {
      case 'frontend-only': return 'bg-blue-100 text-blue-800';
      case 'backend': return 'bg-green-100 text-green-800';
      case 'hybrid': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTestModeDescription = (mode: string) => {
    switch (mode) {
      case 'frontend-only': return 'Frontend Only (localStorage)';
      case 'backend': return 'Backend Only (database)';
      case 'hybrid': return 'Hybrid (backend + localStorage)';
      default: return 'Unknown Mode';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">🧪 Test Subscription Dashboard</h3>
        <span className={`text-xs px-2 py-1 rounded ${getTestModeColor(testMode)}`}>
          {testMode.toUpperCase()}
        </span>
      </div>
      
      <div className="space-y-3">
        {/* Test Mode Info */}
        <div className="text-xs">
          <div className="font-medium text-gray-700">Test Mode:</div>
          <div className="text-gray-600">{getTestModeDescription(testMode)}</div>
          {testMode === 'hybrid' && (
            <div className="text-gray-500 mt-1">
              Uses backend for persistence, localStorage for UI
            </div>
          )}
        </div>

        {/* Current Status */}
        <div className="text-xs">
          <div className="font-medium text-gray-700">Current Status:</div>
          <div className="text-gray-600">
            {subscriptionStatus ? (
              <>
                <div>Status: <span className={`font-medium ${
                  subscriptionStatus.status === 'active' ? 'text-green-600' : 
                  subscriptionStatus.status === 'expired' ? 'text-red-600' : 
                  subscriptionStatus.status === 'cancelled' ? 'text-orange-600' : 'text-gray-600'
                }`}>{subscriptionStatus.status}</span></div>
                {subscriptionStatus.endDate && (
                  <div>Expires: {new Date(subscriptionStatus.endDate).toLocaleString()}</div>
                )}
              </>
            ) : (
              <span className="text-gray-500">No subscription</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <select 
              value={plan} 
              onChange={(e) => setPlan(e.target.value)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              placeholder="Minutes"
              className="text-xs border rounded px-2 py-1 w-20"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCreateSubscription}
              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
            >
              Create
            </button>
            <button
              onClick={handleExpireSubscription}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Expire
            </button>
            <button
              onClick={handleRenewSubscription}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              Renew
            </button>
            <button
              onClick={handleCancelSubscription}
              className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
            >
              Cancel
            </button>
          </div>
          
          <button
            onClick={handleClearSubscription}
            className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 w-full"
          >
            Clear All
          </button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 border-t pt-2">
          <div className="font-medium mb-1">Test Flow:</div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Create subscription</li>
            <li>Wait for expiration or manually expire</li>
            <li>Test renewal flow</li>
            <li>Test cancellation</li>
          </ol>
          {testMode === 'hybrid' && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700">
              <strong>Multi-User Ready:</strong> Each user gets their own test subscription in the database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 