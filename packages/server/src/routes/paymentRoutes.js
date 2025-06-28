const express = require('express');
const router = express.Router();
const PaymentService = require('../services/paymentService');
const { auth } = require('../middleware/auth');

// Initiate M-Pesa payment
router.post('/mpesa', auth, async (req, res) => {
  try {
    const { amount, phoneNumber, description } = req.body;
    const result = await PaymentService.initiateMpesaPayment(
      amount,
      phoneNumber,
      description,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initiate Mix payment
router.post('/mix', auth, async (req, res) => {
  try {
    const { amount, phoneNumber, description } = req.body;
    const result = await PaymentService.initiateMixPayment(
      amount,
      phoneNumber,
      description,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { paymentId, provider } = req.body;
    const result = await PaymentService.verifyPayment(paymentId, provider);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get subscription status
router.get('/subscription', auth, async (req, res) => {
  try {
    const result = await PaymentService.getSubscriptionStatus(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel subscription
router.post('/subscription/cancel', auth, async (req, res) => {
  try {
    const result = await PaymentService.cancelSubscription(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 