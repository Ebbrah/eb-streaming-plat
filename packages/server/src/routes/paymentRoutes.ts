import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { PaymentService } from '../services/paymentService';
import { Payment } from '../models/Payment';
import { Subscription } from '../models/Subscription';

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

const router = express.Router();

// Initiate M-Pesa payment
router.post('/mpesa', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, phoneNumber, description } = req.body;
    const result = await PaymentService.initiateMpesaPayment(
      amount,
      phoneNumber,
      description,
      req.user.id
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// M-Pesa callback
router.post('/mpesa/callback', async (req: Request, res: Response) => {
  try {
    const { Body: { stkCallback: { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } } } = req.body;

    const payment = await Payment.findOne({ paymentId: CheckoutRequestID });
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (ResultCode === 0) {
      // Payment successful
      payment.status = 'completed';
      await payment.save();

      // Create or update subscription
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Monthly subscription

      await Subscription.findOneAndUpdate(
        { userId: payment.userId },
        {
          status: 'active',
          plan: 'monthly',
          startDate: new Date(),
          endDate,
          paymentId: payment._id
        },
        { upsert: true, new: true }
      );
    } else {
      // Payment failed
      payment.status = 'failed';
      await payment.save();
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initiate Mix payment
router.post('/mix', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, phoneNumber, description } = req.body;
    const result = await PaymentService.initiateMixPayment(
      amount,
      phoneNumber,
      description,
      req.user.id
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify payment
router.post('/verify', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId, provider } = req.body;
    const result = await PaymentService.verifyPayment(paymentId, provider);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get subscription status
router.get('/subscription', auth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await PaymentService.getSubscriptionStatus(req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel subscription
router.post('/subscription/cancel', auth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await PaymentService.cancelSubscription(req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router; 