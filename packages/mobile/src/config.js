// API Configuration
// Set this to true to use local development server, false for production
const USE_LOCAL_API = false;

// Development API (local)
const LOCAL_API_URL = 'http://172.20.10.10:3000/api';

// Production API
const PRODUCTION_API_URL = 'https://api.manahuduma.com/api';

// Export the appropriate API URL based on environment
export const API_URL = USE_LOCAL_API ? LOCAL_API_URL : PRODUCTION_API_URL;

// Test mode configuration
export const TEST_MODE = {
  ENABLED: false, // Set to true to enable test subscriptions
  SUBSCRIPTION_DURATION_MINUTES: 5,
  SHOW_TEST_INDICATOR: true,
  ALLOW_MANUAL_EXPIRATION: true
};

// Debug mode - set to true to see detailed network logs
export const DEBUG_MODE = true;

// Log which API we're using
console.log('Mobile App API URL:', API_URL);
console.log('Debug mode:', DEBUG_MODE);
console.log('Test mode:', TEST_MODE.ENABLED);

// Other configuration constants can be added here 