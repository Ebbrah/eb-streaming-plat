import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

export const superAdminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking super admin status',
    });
  }
}; 