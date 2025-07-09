const axios = require('axios');
const Subscription = require('../models/Subscription');

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
        // Create pending subscription, activate on webhook/verification
        const subscription = new Subscription({
          userId,
          plan: 'monthly',
          paymentMethod: 'mpesa',
          phoneNumber,
          amount,
          paymentId: response.data.paymentId,
          paymentStatus: 'pending',
          status: 'pending',
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
        // Create pending subscription, activate on webhook/verification
        const subscription = new Subscription({
          userId,
          plan: 'monthly',
          paymentMethod: 'mix',
          phoneNumber,
          amount,
          paymentId: response.data.paymentId,
          paymentStatus: 'pending',
          status: 'pending',
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
          subscription.paymentStatus = 'completed';
          subscription.calculateEndDate();
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

  // Webhook handler for payment provider callbacks
  static async handleWebhook(payload) {
    try {
      // Example: { paymentId, status, provider }
      const { paymentId, status, provider } = payload;
      const subscription = await Subscription.findOne({ paymentId });
      if (!subscription) {
        return { success: false, message: 'Subscription not found' };
      }
      if (status === 'completed') {
        subscription.status = 'active';
        subscription.paymentStatus = 'completed';
        subscription.calculateEndDate();
      } else if (status === 'failed') {
        subscription.status = 'failed';
        subscription.paymentStatus = 'failed';
      }
      await subscription.save();
      return { success: true };
    } catch (error) {
      console.error('Webhook handler error:', error);
      return { success: false, error: error.message };
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