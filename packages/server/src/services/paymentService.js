const axios = require('axios');
const mongoose = require('mongoose');

// Define subscription schema
const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, enum: ['mpesa', 'mix'], required: true },
  phoneNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  paymentId: { type: String, required: true },
  autoRenew: { type: Boolean, default: true }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

class PaymentService {
  static async initiateMpesaPayment(amount, phoneNumber, description, userId) {
    try {
      // TODO: Replace with your actual M-Pesa API credentials and endpoints
      const response = await axios.post('https://api.mpesa.com/v1/payment', {
        amount,
        phoneNumber,
        description,
        // Add other required M-Pesa parameters
      });

      if (response.data.success) {
        // Create subscription record
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

        const subscription = new Subscription({
          userId,
          provider: 'mpesa',
          phoneNumber,
          amount,
          endDate,
          paymentId: response.data.paymentId
        });

        await subscription.save();
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to initiate M-Pesa payment'
      };
    }
  }

  static async initiateMixPayment(amount, phoneNumber, description, userId) {
    try {
      // TODO: Replace with your actual Mix by Yas API credentials and endpoints
      const response = await axios.post('https://api.mix.com/v1/payment', {
        amount,
        phoneNumber,
        description,
        // Add other required Mix parameters
      });

      if (response.data.success) {
        // Create subscription record
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

        const subscription = new Subscription({
          userId,
          provider: 'mix',
          phoneNumber,
          amount,
          endDate,
          paymentId: response.data.paymentId
        });

        await subscription.save();
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Mix payment error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to initiate Mix payment'
      };
    }
  }

  static async verifyPayment(paymentId, provider) {
    try {
      const endpoint = provider === 'mpesa' 
        ? 'https://api.mpesa.com/v1/verify'
        : 'https://api.mix.com/v1/verify';

      const response = await axios.post(endpoint, {
        paymentId,
        // Add other required verification parameters
      });

      if (response.data.success) {
        // Update subscription status
        const subscription = await Subscription.findOne({ paymentId });
        if (subscription) {
          subscription.status = 'active';
          await subscription.save();
        }
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify payment'
      };
    }
  }

  static async getSubscriptionStatus(userId) {
    try {
      const subscription = await Subscription.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() }
      });

      return {
        success: true,
        data: subscription
      };
    } catch (error) {
      console.error('Get subscription status error:', error);
      return {
        success: false,
        error: 'Failed to get subscription status'
      };
    }
  }

  static async cancelSubscription(userId) {
    try {
      const subscription = await Subscription.findOne({
        userId,
        status: 'active'
      });

      if (subscription) {
        subscription.status = 'cancelled';
        subscription.autoRenew = false;
        await subscription.save();
      }

      return {
        success: true,
        data: subscription
      };
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return {
        success: false,
        error: 'Failed to cancel subscription'
      };
    }
  }
}

module.exports = PaymentService; 