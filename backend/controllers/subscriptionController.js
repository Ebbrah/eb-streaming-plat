const Subscription = require('../models/Subscription');
const User = require('../models/User');

class SubscriptionController {
    // Create or activate subscription
    static async createSubscription(req, res) {
        try {
            const { plan = 'monthly', paymentMethod = 'temporary', phoneNumber } = req.body;
            const userId = req.user.userId;

            // Check if user already has an active subscription
            let existingSubscription = await Subscription.findOne({ 
                userId, 
                status: { $in: ['active', 'pending'] } 
            });

            if (existingSubscription) {
                return res.status(400).json({
                    success: false,
                    message: 'User already has an active subscription'
                });
            }

            // Create new subscription
            const subscription = new Subscription({
                userId,
                plan,
                paymentMethod,
                phoneNumber,
                status: 'active',
                paymentStatus: paymentMethod === 'temporary' ? 'temporary' : 'pending',
                startDate: new Date()
            });

            // Calculate end date
            subscription.calculateEndDate();

            await subscription.save();

            res.status(201).json({
                success: true,
                message: 'Subscription created successfully',
                data: {
                    id: subscription._id,
                    status: subscription.status,
                    plan: subscription.plan,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    paymentMethod: subscription.paymentMethod,
                    paymentStatus: subscription.paymentStatus
                }
            });
        } catch (error) {
            console.error('Subscription creation error:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating subscription'
            });
        }
    }

    // TEST ONLY: Create a test subscription (short-lived)
    static async createTestSubscription(req, res) {
        try {
            console.log('Test subscription: req.user:', req.user);
            const userId = req.user.userId;
            if (!userId) {
                console.error('No userId in req.user:', req.user);
            }
            // Temporarily allow test subscriptions for development/testing
            // TODO: Remove this bypass and use proper environment variable in production
            const allowTestSubscriptions = process.env.ALLOW_TEST_SUBSCRIPTIONS === 'true' || true;
            
            if (!allowTestSubscriptions) {
                return res.status(403).json({
                    success: false,
                    message: 'Test subscriptions are not enabled.'
                });
            }

            // Check if user already has an active subscription
            let existingSubscription = await Subscription.findOne({ 
                userId, 
                status: { $in: ['active', 'pending'] } 
            });

            if (existingSubscription) {
                console.log('User already has an active subscription:', existingSubscription);
                return res.status(400).json({
                    success: false,
                    message: 'User already has an active subscription'
                });
            }

            // Create new test subscription
            const subscription = new Subscription({
                userId,
                plan: 'monthly',
                paymentMethod: 'test',
                status: 'active',
                paymentStatus: 'completed',
                startDate: new Date()
            });

            // Calculate end date using test logic
            subscription.calculateEndDate();
            await subscription.save();

            res.status(201).json({
                success: true,
                message: 'Test subscription created successfully',
                data: {
                    id: subscription._id,
                    status: subscription.status,
                    plan: subscription.plan,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    paymentMethod: subscription.paymentMethod,
                    paymentStatus: subscription.paymentStatus
                }
            });
        } catch (error) {
            console.error('Test subscription creation error:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating test subscription',
                error: error.message,
            });
        }
    }

    // Get subscription status
    static async getSubscriptionStatus(req, res) {
        try {
            const userId = req.user.userId;

            const subscription = await Subscription.findOne({ 
                userId,
                status: { $in: ['active', 'pending'] }
            }).sort({ createdAt: -1 });

            // Debug log: print the subscription found and its dates
            console.log('[getSubscriptionStatus] Found subscription:', subscription ? {
                id: subscription._id,
                status: subscription.status,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                paymentMethod: subscription.paymentMethod,
                paymentStatus: subscription.paymentStatus,
                createdAt: subscription.createdAt,
                updatedAt: subscription.updatedAt
            } : null);

            if (!subscription) {
                return res.json({
                    success: true,
                    data: {
                        status: 'inactive',
                        hasSubscription: false
                    }
                });
            }

            // Check if subscription is still active (not expired)
            const isActive = subscription.isActive();

            res.json({
                success: true,
                data: {
                    id: subscription._id,
                    status: isActive ? subscription.status : 'expired',
                    plan: subscription.plan,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    paymentMethod: subscription.paymentMethod,
                    paymentStatus: subscription.paymentStatus,
                    amount: subscription.amount,
                    currency: subscription.currency,
                    autoRenew: subscription.autoRenew,
                    hasSubscription: true,
                    isActive
                }
            });
        } catch (error) {
            console.error('Subscription status error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching subscription status'
            });
        }
    }

    // Cancel subscription
    static async cancelSubscription(req, res) {
        try {
            const userId = req.user.userId;

            const subscription = await Subscription.findOne({ 
                userId,
                status: { $in: ['active', 'pending'] }
            });

            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: 'No active subscription found'
                });
            }

            subscription.status = 'cancelled';
            subscription.autoRenew = false;
            await subscription.save();

            res.json({
                success: true,
                message: 'Subscription cancelled successfully',
                data: {
                    id: subscription._id,
                    status: subscription.status
                }
            });
        } catch (error) {
            console.error('Subscription cancellation error:', error);
            res.status(500).json({
                success: false,
                message: 'Error cancelling subscription'
            });
        }
    }

    // Get subscription history
    static async getSubscriptionHistory(req, res) {
        try {
            const userId = req.user.userId;

            const subscriptions = await Subscription.find({ userId })
                .sort({ createdAt: -1 })
                .limit(10);

            res.json({
                success: true,
                data: subscriptions.map(sub => ({
                    id: sub._id,
                    status: sub.status,
                    plan: sub.plan,
                    startDate: sub.startDate,
                    endDate: sub.endDate,
                    paymentMethod: sub.paymentMethod,
                    paymentStatus: sub.paymentStatus,
                    amount: sub.amount,
                    currency: sub.currency,
                    createdAt: sub.createdAt
                }))
            });
        } catch (error) {
            console.error('Subscription history error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching subscription history'
            });
        }
    }

    // Update subscription payment status
    static async updatePaymentStatus(req, res) {
        try {
            const { subscriptionId, paymentStatus, paymentId } = req.body;
            const userId = req.user.userId;

            const subscription = await Subscription.findOne({ 
                _id: subscriptionId,
                userId 
            });

            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: 'Subscription not found'
                });
            }

            subscription.paymentStatus = paymentStatus;
            if (paymentId) {
                subscription.paymentId = paymentId;
            }

            if (paymentStatus === 'completed') {
                subscription.status = 'active';
                subscription.calculateEndDate();
            }

            await subscription.save();

            res.json({
                success: true,
                message: 'Payment status updated successfully',
                data: {
                    id: subscription._id,
                    status: subscription.status,
                    paymentStatus: subscription.paymentStatus
                }
            });
        } catch (error) {
            console.error('Payment status update error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating payment status'
            });
        }
    }

    // Get user profile with subscription info
    static async getUserProfileWithSubscription(req, res) {
        try {
            const userId = req.user.userId;

            const user = await User.findById(userId).select('-password');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const subscription = await Subscription.findOne({ 
                userId,
                status: { $in: ['active', 'pending'] }
            }).sort({ createdAt: -1 });

            const profileData = {
                id: user._id,
                email: user.email,
                name: user.name,
                mobileNumber: user.mobileNumber,
                role: user.role,
                isSuperAdmin: user.isSuperAdmin || false,
                subscription: subscription ? {
                    id: subscription._id,
                    status: subscription.isActive() ? subscription.status : 'expired',
                    plan: subscription.plan,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    paymentMethod: subscription.paymentMethod,
                    paymentStatus: subscription.paymentStatus,
                    amount: subscription.amount,
                    currency: subscription.currency,
                    autoRenew: subscription.autoRenew,
                    hasSubscription: true,
                    isActive: subscription.isActive()
                } : {
                    hasSubscription: false,
                    status: 'inactive'
                }
            };

            res.json({
                success: true,
                data: profileData
            });
        } catch (error) {
            console.error('Profile with subscription error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching profile with subscription'
            });
        }
    }
}

module.exports = SubscriptionController; 