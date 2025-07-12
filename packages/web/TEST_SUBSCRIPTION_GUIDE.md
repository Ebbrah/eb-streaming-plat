# 🧪 Test Subscription System Guide

This guide explains how to test the entire subscription lifecycle in your web app with support for multiple users and backend persistence.

## 🚀 Quick Start

### 1. Enable Test Mode
Add to your `packages/web/.env` file:
```env
NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS=true
NEXT_PUBLIC_API_URL=https://api.manahuduma.com
NEXT_PUBLIC_TEST_MODE=hybrid
```

### 2. Restart Your Development Server
```bash
npm run dev
# or
yarn dev
```

### 3. Test Dashboard
A test dashboard will appear in the bottom-right corner of your app when in test mode.

---

## 🔧 Test Modes

### **Mode 1: Frontend-Only (`frontend-only`)**
- ✅ **Fastest**: No API calls
- ✅ **Offline testing**: Works without backend
- ❌ **Single user only**: localStorage is shared
- ❌ **No persistence**: Data lost on browser clear
- ❌ **No backend testing**: Can't test real subscription logic

**Best for:** Quick UI testing, offline development

### **Mode 2: Backend-Only (`backend`)**
- ✅ **Real persistence**: Data saved to database
- ✅ **Multi-user support**: Each user gets own subscription
- ✅ **Full backend testing**: Tests real subscription logic
- ❌ **Requires backend**: Must have backend running
- ❌ **Slower**: API calls required

**Best for:** Backend integration testing, production-like testing

### **Mode 3: Hybrid (`hybrid`) - RECOMMENDED**
- ✅ **Best of both worlds**: Backend persistence + frontend speed
- ✅ **Multi-user support**: Each user gets own subscription
- ✅ **Fallback support**: Works even if backend is down
- ✅ **Real testing**: Tests actual subscription lifecycle
- ✅ **Fast UI**: localStorage for immediate UI updates

**Best for:** Production testing, multi-user scenarios

---

## 📋 Complete Test Flow

### **Phase 1: Registration & Initial Subscription**
1. **Register a new user** → Fill out registration form
2. **Click "Continue without payment"** → Creates test subscription
3. **Verify access** → Should redirect to home page with full access

### **Phase 2: Subscription Expiration**
1. **Wait for expiration** → Test subscription expires after 5 minutes (configurable)
2. **Or manually expire** → Use "Expire" button in test dashboard
3. **Verify redirect** → Should redirect to payment page with "expired" status

### **Phase 3: Subscription Renewal**
1. **Click "Renew Subscription"** → Creates new test subscription
2. **Or use test dashboard** → Click "Renew" button
3. **Verify access restored** → Should redirect back to home page

### **Phase 4: Subscription Cancellation**
1. **Use test dashboard** → Click "Cancel" button
2. **Verify cancellation** → Status should change to "cancelled"
3. **Test access** → Should be redirected to payment page

---

## 👥 Multi-User Testing

### **How Multi-User Testing Works**

#### **Frontend-Only Mode:**
- ❌ **Single user only** - all users share same localStorage
- ❌ **No isolation** - can't test multiple users simultaneously

#### **Backend/Hybrid Mode:**
- ✅ **Each user gets own subscription** in database
- ✅ **Real user isolation** - users don't interfere with each other
- ✅ **Persistent data** - subscriptions survive browser restarts
- ✅ **Concurrent testing** - multiple users can test simultaneously

### **Testing Multiple Users**

1. **Open multiple browser windows/tabs**
2. **Register different users** in each window
3. **Create test subscriptions** for each user
4. **Test different scenarios** simultaneously:
   - User A: Active subscription
   - User B: Expired subscription
   - User C: Cancelled subscription
   - User D: No subscription

### **Verifying Multi-User Isolation**

1. **Check backend database** for multiple subscription records
2. **Verify each user** sees only their own subscription status
3. **Test concurrent operations** (create, expire, renew, cancel)
4. **Check localStorage** for user-specific data (hybrid mode)

---

## 🎛️ Test Dashboard Controls

### **Current Status Display**
- Shows current subscription status (active/expired/cancelled)
- Displays expiration date and time
- Color-coded status indicators
- **Test mode indicator** (frontend-only/backend/hybrid)

### **Subscription Controls**
- **Plan Selector**: Choose between monthly/yearly
- **Duration Input**: Set subscription duration in minutes
- **Create**: Create new test subscription
- **Expire**: Manually expire current subscription
- **Renew**: Renew expired subscription
- **Cancel**: Cancel active subscription
- **Clear All**: Remove all test data

---

## ⚙️ Configuration

### **Environment Variables**
```env
# Enable test mode
NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS=true

# API URL for backend calls
NEXT_PUBLIC_API_URL=https://api.manahuduma.com

# Test mode type: frontend-only | backend | hybrid
NEXT_PUBLIC_TEST_MODE=hybrid

# Test subscription duration (minutes)
TEST_SUBSCRIPTION_MINUTES=5
```

### **Test Configuration File**
Located at `packages/web/src/lib/testConfig.ts`:
- Subscription settings
- Payment simulation
- Feature flags
- UI preferences

---

## 🔄 Switching Between Test Modes

### **Frontend-Only Mode**
```env
NEXT_PUBLIC_TEST_MODE=frontend-only
```

### **Backend-Only Mode**
```env
NEXT_PUBLIC_TEST_MODE=backend
```

### **Hybrid Mode (Recommended)**
```env
NEXT_PUBLIC_TEST_MODE=hybrid
```

---

## 🔄 Switching to Production

### **Step 1: Disable Test Mode**
```env
NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS=false
```

### **Step 2: Update Payment Integration**
Replace test payment logic in `packages/web/src/app/payment/page.tsx`:
```typescript
// Replace this:
if (isTestEnabled) {
  await createTestSubscription('monthly', 5);
}

// With this:
const paymentResponse = await initiateRealPayment({
  amount: 5.99,
  currency: 'USD',
  paymentMethod: 'mpesa' // or 'mix'
});
```

### **Step 3: Remove Test Dashboard**
The test dashboard automatically hides when test mode is disabled.

---

## 🧪 Advanced Testing

### **Testing Error Scenarios**
The test system includes:
- **5% failure rate** for payment simulation
- **API delay simulation** (1 second)
- **Network error handling**
- **Invalid token scenarios**

### **Testing Different Plans**
- **Monthly**: 30 days (or custom duration)
- **Yearly**: 365 days (or custom duration)
- **Custom duration**: Set in minutes for quick testing

### **Testing Edge Cases**
- **Expired subscriptions**
- **Cancelled subscriptions**
- **Multiple renewals**
- **Concurrent requests**
- **Database failures**
- **Network timeouts**

---

## 🔍 Debugging

### **Console Logs**
Test mode provides detailed console logs:
```
[FRONTEND TEST MODE] Test subscription created: {...}
[BACKEND TEST MODE] Test subscription created: {...}
[HYBRID TEST MODE] Test subscription created: {...}
```

### **Local Storage**
Test data is stored in localStorage:
- `testSubscription`: Current subscription data (frontend-only)
- `testSubscription_${userId}`: User-specific data (hybrid mode)
- `testUser`: Test user data
- `testPayment`: Test payment data

### **Network Tab**
Monitor API calls to understand the flow:
- `/api/subscriptions/test-create` (backend/hybrid modes)
- `/api/subscriptions/status` (backend/hybrid modes)
- `/api/users/profile` (all modes)

### **Database Inspection**
For backend/hybrid modes, check MongoDB:
```javascript
// Check all test subscriptions
db.subscriptions.find({paymentMethod: "test"})

// Check specific user's subscription
db.subscriptions.find({userId: ObjectId("user_id_here")})
```

---

## 🚨 Troubleshooting

### **Issue: Still getting "subscription expired"**
**Solution**: Check that `NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS=true` is set and restart the dev server.

### **Issue: Test dashboard not showing**
**Solution**: Verify test mode is enabled and you're authenticated.

### **Issue: Can't create test subscription**
**Solution**: Clear localStorage and try again, or check console for errors.

### **Issue: Multiple users interfering**
**Solution**: Use `hybrid` or `backend` mode instead of `frontend-only`.

### **Issue: Backend API errors**
**Solution**: Check that backend is running and `ALLOW_TEST_SUBSCRIPTIONS=true` is set in backend `.env`.

### **Issue: Mobile app affected**
**Solution**: Test mode only affects the web app. Mobile app uses the real backend.

---

## 📊 Test Metrics

### **What Gets Tested**
- ✅ User registration flow
- ✅ Subscription creation
- ✅ Subscription expiration
- ✅ Subscription renewal
- ✅ Subscription cancellation
- ✅ Payment page redirects
- ✅ Home page access control
- ✅ Error handling
- ✅ API response handling
- ✅ Multi-user scenarios (backend/hybrid modes)
- ✅ Database persistence (backend/hybrid modes)
- ✅ Concurrent operations (backend/hybrid modes)

### **What Doesn't Get Tested**
- ❌ Real payment processing
- ❌ Production payment APIs
- ❌ Mobile app integration

---

## 🎯 Best Practices

1. **Use hybrid mode** for comprehensive testing
2. **Test with multiple users** to verify isolation
3. **Test the complete flow** from registration to cancellation
4. **Use different durations** to test expiration scenarios
5. **Test error scenarios** by triggering failures
6. **Clear test data** between test sessions
7. **Monitor console logs** for debugging
8. **Test on different browsers** for compatibility
9. **Verify database records** for backend/hybrid modes
10. **Test concurrent operations** for multi-user scenarios

---

## 🔗 Related Files

- `packages/web/src/lib/auth.tsx` - Test subscription logic
- `packages/web/src/app/payment/page.tsx` - Payment flow
- `packages/web/src/app/components/TestSubscriptionDashboard.tsx` - Test UI
- `packages/web/src/lib/testConfig.ts` - Test configuration
- `packages/web/src/app/api/subscriptions/test-create/route.ts` - Test API
- `backend/controllers/subscriptionController.js` - Backend test logic

---

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Clear localStorage and try again
4. Check that test mode is enabled
5. For backend issues, verify backend is running
6. For multi-user issues, use hybrid or backend mode

**Happy Testing! 🎉** 