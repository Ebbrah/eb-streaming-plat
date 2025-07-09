const Subscription = require('../models/Subscription');

module.exports = async function requireActiveSubscription(req, res, next) {
  // Allow admins and superadmins to bypass subscription check
  if (req.user && (req.user.role === 'admin' || req.user.isSuperAdmin)) {
    return next();
  }
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });
    if (!subscription) {
      return res.status(403).json({ success: false, message: 'Active subscription required' });
    }
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription middleware error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 