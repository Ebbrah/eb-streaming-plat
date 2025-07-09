import { useContext } from 'react';
// import { AuthContext } from '...'; // Uncomment and fix path if you use context

const isTestEnabled = process.env.NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS === 'true';

function createTestSubscription(token: string) {
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
      } else {
        alert(data.message || 'Failed to create test subscription');
      }
    });
}

export default function PaymentPage() {
  // TODO: Replace with your actual logic to get the user token
  const userToken = ""; // <-- Replace with real token logic

  return (
    <div>
      {/* ...your existing payment UI... */}
      {isTestEnabled && (
        <button onClick={() => createTestSubscription(userToken)}>
          Continue without payment (Test)
        </button>
      )}
    </div>
  );
} 