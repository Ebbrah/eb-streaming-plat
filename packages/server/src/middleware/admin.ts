import { Request, Response, NextFunction } from 'express';

interface AdminRequest extends Request {
  user?: any;
}

export const admin = (req: AdminRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.isAdmin) {
    next();
    return;
  }
  res.status(403).json({
    success: false,
    message: 'Access denied. Admins only.'
  });
  return;
}; 