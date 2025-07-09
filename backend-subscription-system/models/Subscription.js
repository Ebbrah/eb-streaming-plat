const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending', 'cancelled', 'expired'],
        default: 'inactive'
    },
    plan: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    amount: {
        type: Number,
        required: true,
        default: 5.99
    },
    currency: {
        type: String,
        default: 'USD'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ['mpesa', 'mix', 'temporary'],
        default: 'temporary'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'temporary'],
        default: 'temporary'
    },
    paymentId: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    autoRenew: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
subscriptionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
    return this.status === 'active' && (!this.endDate || this.endDate > new Date());
};

// Method to calculate end date based on plan
subscriptionSchema.methods.calculateEndDate = function() {
    const startDate = this.startDate || new Date();
    if (this.plan === 'monthly') {
        this.endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    } else if (this.plan === 'yearly') {
        this.endDate = new Date(startDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 365 days
    }
};

module.exports = mongoose.model('Subscription', subscriptionSchema); 