# 🧪 Test Subscription System Guide

This guide explains how to test the entire subscription lifecycle in your web app without affecting the mobile app or backend.

## 🚀 Quick Start

### 1. Enable Test Mode
Add to your `.env` file:
```env
NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS=true
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

## 🎛️ Test Dashboard Controls

### **Current Status Display**
- Shows current subscription status (active/expired/cancelled)
- Displays expiration date and time
- Color-coded status indicators

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

# Test subscription duration (minutes)
TEST_SUBSCRIPTION_MINUTES=5

# Backend API URL (for fallback)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### **Test Configuration File**
Located at `packages/web/src/lib/testConfig.ts`:
- Subscription settings
- Payment simulation
- Feature flags
- UI preferences

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

---

## 🔍 Debugging

### **Console Logs**
Test mode provides detailed console logs:
```
[TEST MODE] Test subscription created: {...}
[TEST MODE] Test subscription expired: {...}
[TEST MODE] Test subscription renewed: {...}
```

### **Local Storage**
Test data is stored in localStorage:
- `testSubscription`: Current subscription data
- `testUser`: Test user data
- `testPayment`: Test payment data

### **Network Tab**
Monitor API calls to understand the flow:
- `/api/subscriptions/test-create`
- `/api/subscriptions/status`
- `/api/users/profile`

---

## 🚨 Troubleshooting

### **Issue: Still getting "subscription expired"**
**Solution**: Check that `NEXT_PUBLIC_ALLOW_TEST_SUBSCRIPTIONS=true` is set and restart the dev server.

### **Issue: Test dashboard not showing**
**Solution**: Verify test mode is enabled and you're authenticated.

### **Issue: Can't create test subscription**
**Solution**: Clear localStorage and try again, or check console for errors.

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

### **What Doesn't Get Tested**
- ❌ Real payment processing
- ❌ Backend database changes
- ❌ Mobile app integration
- ❌ Production payment APIs

---

## 🎯 Best Practices

1. **Test the complete flow** from registration to cancellation
2. **Use different durations** to test expiration scenarios
3. **Test error scenarios** by triggering failures
4. **Clear test data** between test sessions
5. **Monitor console logs** for debugging
6. **Test on different browsers** for compatibility

---

## 🔗 Related Files

- `packages/web/src/lib/auth.tsx` - Test subscription logic
- `packages/web/src/app/payment/page.tsx` - Payment flow
- `packages/web/src/app/components/TestSubscriptionDashboard.tsx` - Test UI
- `packages/web/src/lib/testConfig.ts` - Test configuration
- `packages/web/src/app/api/subscriptions/test-create/route.ts` - Test API

---

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Clear localStorage and try again
4. Check that test mode is enabled

**Happy Testing! 🎉** 