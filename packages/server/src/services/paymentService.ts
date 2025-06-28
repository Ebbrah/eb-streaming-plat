import mongoose from 'mongoose';
import axios from 'axios';
import { Payment, IPayment } from '../models/Payment';
import { Subscription, ISubscription } from '../models/Subscription';

interface PaymentResult {
  success: boolean;
  data?: any;
  message?: string;
}

export class PaymentService {
  private static readonly MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
  private static readonly MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
  private static readonly MPESA_API_KEY = process.env.MPESA_API_KEY;
  private static readonly MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '1500847';
  private static readonly MPESA_ENV = process.env.MPESA_ENV || 'sandbox';

  private static async getMpesaAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.MPESA_CONSUMER_KEY}:${this.MPESA_CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(
      `${this.MPESA_ENV === 'sandbox' ? 'https://sandbox.vodacom.co.tz' : 'https://api.vodacom.co.tz'}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.access_token;
  }

  static async initiateMpesaPayment(
    amount: number,
    phoneNumber: string,
    description: string,
    userId: string
  ): Promise<PaymentResult> {
    try {
      // Create payment record
      const payment = new Payment({
        userId: new mongoose.Types.ObjectId(userId),
        amount,
        currency: 'TZS',
        status: 'pending',
        provider: 'mpesa',
        paymentId: new mongoose.Types.ObjectId().toString(),
        phoneNumber,
        description
      });
      await payment.save();

      // Get M-Pesa access token
      const accessToken = await this.getMpesaAccessToken();

      // Format phone number (remove leading 0 and add country code if needed)
      const formattedPhone = phoneNumber.startsWith('0') ? `255${phoneNumber.slice(1)}` : phoneNumber;

      // Generate timestamp
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);

      // Initiate STK Push
      const response = await axios.post(
        `${this.MPESA_ENV === 'sandbox' ? 'https://sandbox.vodacom.co.tz' : 'https://api.vodacom.co.tz'}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: this.MPESA_SHORTCODE,
          Password: this.generatePassword(timestamp),
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: formattedPhone,
          PartyB: this.MPESA_SHORTCODE,
          PhoneNumber: formattedPhone,
          CallBackURL: `${process.env.API_URL}/api/payments/mpesa/callback`,
          AccountReference: payment.paymentId,
          TransactionDesc: description
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-API-Key': this.MPESA_API_KEY
          }
        }
      );

      // Update payment record with M-Pesa checkout request ID
      payment.paymentId = response.data.CheckoutRequestID;
      await payment.save();

      return {
        success: true,
        data: {
          paymentId: payment.paymentId,
          status: 'pending',
          amount,
          phoneNumber,
          description
        }
      };
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      throw new Error('Failed to initiate M-Pesa payment');
    }
  }

  private static generatePassword(timestamp: string): string {
    const str = `${this.MPESA_SHORTCODE}${this.MPESA_API_KEY}${timestamp}`;
    return Buffer.from(str).toString('base64');
  }

  static async initiateMixPayment(
    amount: number,
    phoneNumber: string,
    description: string,
    userId: string
  ): Promise<PaymentResult> {
    try {
      // Create payment record
      const payment = new Payment({
        userId: new mongoose.Types.ObjectId(userId),
        amount,
        currency: 'TZS',
        status: 'pending',
        provider: 'mix',
        paymentId: new mongoose.Types.ObjectId().toString(),
        phoneNumber,
        description
      });
      await payment.save();

      // TODO: Implement actual Mix payment integration
      // For now, return a mock successful response
      return {
        success: true,
        data: {
          paymentId: payment.paymentId,
          status: 'pending',
          amount,
          phoneNumber,
          description
        }
      };
    } catch (error) {
      throw new Error('Failed to initiate Mix payment');
    }
  }

  static async verifyPayment(
    paymentId: string,
    provider: string
  ): Promise<PaymentResult> {
    try {
      const payment = await Payment.findOne({ paymentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (provider === 'mpesa') {
        // Get M-Pesa access token
        const accessToken = await this.getMpesaAccessToken();

        // Query M-Pesa transaction status
        const response = await axios.get(
          `${this.MPESA_ENV === 'sandbox' ? 'https://sandbox.vodacom.co.tz' : 'https://api.vodacom.co.tz'}/mpesa/stkpushquery/v1/query`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'X-API-Key': this.MPESA_API_KEY
            },
            params: {
              BusinessShortCode: this.MPESA_SHORTCODE,
              Password: this.generatePassword(new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)),
              Timestamp: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3),
              CheckoutRequestID: paymentId
            }
          }
        );

        if (response.data.ResultCode === 0) {
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

          return {
            success: true,
            data: {
              paymentId,
              status: 'completed',
              provider
            }
          };
        } else {
          payment.status = 'failed';
          await payment.save();
          throw new Error('Payment verification failed');
        }
      } else {
        // TODO: Implement Mix payment verification
        payment.status = 'completed';
        await payment.save();
        return {
          success: true,
          data: {
            paymentId,
            status: 'completed',
            provider
          }
        };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new Error('Failed to verify payment');
    }
  }

  static async getSubscriptionStatus(userId: string): Promise<PaymentResult> {
    try {
      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return {
          success: true,
          data: {
            status: 'inactive',
            userId
          }
        };
      }

      // Check if subscription has expired
      if (subscription.endDate < new Date()) {
        subscription.status = 'expired';
        await subscription.save();
      }

      return {
        success: true,
        data: {
          status: subscription.status,
          plan: subscription.plan,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          userId
        }
      };
    } catch (error) {
      throw new Error('Failed to get subscription status');
    }
  }

  static async cancelSubscription(userId: string): Promise<PaymentResult> {
    try {
      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      subscription.status = 'cancelled';
      await subscription.save();

      return {
        success: true,
        data: {
          status: 'cancelled',
          userId
        }
      };
    } catch (error) {
      throw new Error('Failed to cancel subscription');
    }
  }
} 