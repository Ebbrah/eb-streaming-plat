# 🔐 Authentication System Setup Guide

## 🚀 Quick Setup

### 1. Environment Configuration

Create a `.env.local` file in `packages/web/` with:

```env
# Your backend API URL (replace with your actual backend URL)
NEXT_PUBLIC_API_URL=https://your-backend-api.com

# Test mode settings (for development)
NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS=true
NEXT_PUBLIC_TEST_MODE=hybrid
NEXT_PUBLIC_DISABLE_AUTO_SUBSCRIPTION=false
```

### 2. Backend Requirements

Your backend should have these endpoints:

- `POST /api/users/register/user` - User registration
- `POST /api/users/login` - User login  
- `GET /api/users/profile` - Get user profile
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/test-create` - Create test subscription

### 3. Expected API Responses

#### Registration Response:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user",
      "isSuperAdmin": false
    }
  }
}
```

#### Login Response:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user",
      "isSuperAdmin": false
    }
  }
}
```

## 🔄 How It Works

### Registration Flow:
1. User fills registration form
2. Form submits to `/api/users/register/user`
3. Backend creates user and returns token + user data
4. Frontend stores token in localStorage
5. User is automatically logged in
6. Redirects to `/payment` page

### Login Flow:
1. User fills login form
2. Form submits to `/api/users/login`
3. Backend validates credentials and returns token + user data
4. Frontend stores token in localStorage
5. Checks subscription status
6. Redirects based on subscription:
   - Active subscription → `/` (home)
   - No subscription → `/payment?expired=1`

## 🧪 Testing

### 1. Test Registration:
```bash
# Start your development server
npm run dev

# Go to: http://localhost:3000/auth/register
# Fill out the form and submit
# Check browser console for logs
# Should redirect to /payment
```

### 2. Test Login:
```bash
# Go to: http://localhost:3000/auth/login
# Use credentials from registration
# Check browser console for logs
# Should redirect based on subscription status
```

### 3. Check Network Tab:
- Look for POST requests to `/api/users/register/user` and `/api/users/login`
- Check response status and data
- Verify token is stored in localStorage

## 🔧 Troubleshooting

### Issue: "Registration failed"
**Check:**
- Is `NEXT_PUBLIC_API_URL` set correctly?
- Is your backend running and accessible?
- Are the API endpoints working?

### Issue: "Login failed"
**Check:**
- Are the credentials correct?
- Is the backend returning the expected response format?
- Check browser network tab for the actual error

### Issue: User not logged in after registration
**Check:**
- Is the token being stored in localStorage?
- Is the user state being set in the auth context?
- Check browser console for any errors

### Issue: Wrong redirects
**Check:**
- Is subscription status being fetched correctly?
- Are the redirect conditions working as expected?

## 📝 Debug Logs

The new system includes detailed console logs:

```
🔄 Starting registration for: user@example.com
✅ Registration successful: {success: true, data: {...}}
✅ User registered and logged in successfully
✅ Registration successful, redirecting to payment...

🔄 Starting login for: user@example.com  
✅ Login successful: {success: true, data: {...}}
✅ User logged in successfully
✅ User has active subscription, redirecting to home
```

## 🚨 Production Deployment

### 1. Disable Test Mode:
```env
NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS=false
```

### 2. Set Production API URL:
```env
NEXT_PUBLIC_API_URL=https://your-production-api.com
```

### 3. Test All Flows:
- Registration
- Login
- Subscription creation
- Payment processing

## 📁 Files Changed

- `packages/web/src/lib/auth.tsx` - Complete rewrite
- `packages/web/src/app/auth/register/page.tsx` - Simplified registration
- `packages/web/src/app/auth/login/page.tsx` - Simplified login

## 🎯 Key Improvements

1. **Simplified Flow**: No more deferred registration
2. **Clear Separation**: Registration and login are separate processes
3. **Better Error Handling**: Clear error messages and logging
4. **Consistent API**: Uses helper functions for all API calls
5. **Automatic Login**: Registration automatically logs in the user
6. **Smart Redirects**: Login redirects based on subscription status 