const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');

// Add request logging middleware
router.use((req, res, next) => {
    console.log('Subscription route accessed:', {
        method: req.method,
        path: req.path,
        baseUrl: req.baseUrl,
        originalUrl: req.originalUrl,
        headers: req.headers,
        body: req.method === 'POST' ? { ...req.body, password: '[REDACTED]' } : undefined
    });
    next();
});

// Create subscription (protected)
router.post('/create', auth, async (req, res, next) => {
    try {
        await SubscriptionController.createSubscription(req, res);
    } catch (error) {
        next(error);
    }
});

// Get subscription status (protected)
router.get('/status', auth, async (req, res, next) => {
    try {
        await SubscriptionController.getSubscriptionStatus(req, res);
    } catch (error) {
        next(error);
    }
});

// Cancel subscription (protected)
router.post('/cancel', auth, async (req, res, next) => {
    try {
        await SubscriptionController.cancelSubscription(req, res);
    } catch (error) {
        next(error);
    }
});

// Get subscription history (protected)
router.get('/history', auth, async (req, res, next) => {
    try {
        await SubscriptionController.getSubscriptionHistory(req, res);
    } catch (error) {
        next(error);
    }
});

// Update payment status (protected)
router.post('/update-payment', auth, async (req, res, next) => {
    try {
        await SubscriptionController.updatePaymentStatus(req, res);
    } catch (error) {
        next(error);
    }
});

// Get user profile with subscription info (protected)
router.get('/profile', auth, async (req, res, next) => {
    try {
        await SubscriptionController.getUserProfileWithSubscription(req, res);
    } catch (error) {
        next(error);
    }
});

module.exports = router; 