import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { User } from '../models/User';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import { superAdminAuth } from '../middleware/superAdminAuth';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import multer from 'multer';
import { S3Service } from '../services/s3Service';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

interface RegisterRequest extends Request {
  body: {
    email: string;
    password: string;
    name: string;
    role?: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface AuthRequest extends Request {
  user?: any;
}

// Register user (admin only)
router.post(
  '/register',
  auth as express.RequestHandler,
  superAdminAuth as express.RequestHandler,
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role').isIn(['user', 'admin']).withMessage('Invalid role'),
  ],
  async (req: RegisterRequest, res: Response): Promise<void> => {
    try {
      const { email, password, name, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User already exists',
        });
        return;
      }

      // Create new user
      const user = new User({
        email,
        password,
        name,
        role: role || 'user',
      });

      await user.save();

      // Generate token
      const signOptions: SignOptions = {
        expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
      };

      const secret: Secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
      const token = jwt.sign({ _id: user._id }, secret, signOptions);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            isSuperAdmin: user.isSuperAdmin,
            level: user.level,
            experience: user.experience,
            achievements: user.achievements,
            preferences: user.preferences,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating user',
      });
    }
  }
);

// Register regular user (public)
router.post(
  '/register/user',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
  ],
  async (req: RegisterRequest, res: Response): Promise<void> => {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User already exists',
        });
        return;
      }

      // Create new user
      const user = new User({
        email,
        password,
        name,
        role: 'user',
      });

      await user.save();

      // Generate token
      const signOptions: SignOptions = {
        expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
      };

      const secret: Secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
      const token = jwt.sign({ _id: user._id }, secret, signOptions);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            isSuperAdmin: user.isSuperAdmin,
            level: user.level,
            experience: user.experience,
            achievements: user.achievements,
            preferences: user.preferences,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating user',
      });
    }
  }
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: LoginRequest, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt for email:', email);

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        console.log('User not found:', email);
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log('Invalid password for user:', email);
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Generate token
      const signOptions: SignOptions = {
        expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
      };

      const secret: Secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
      if (!process.env.JWT_SECRET) {
        console.warn('Warning: JWT_SECRET is not set in environment variables');
      }

      const token = jwt.sign({ _id: user._id }, secret, signOptions);
      console.log('Login successful for user:', email);

      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            isSuperAdmin: user.isSuperAdmin,
            level: user.level,
            experience: user.experience,
            achievements: user.achievements,
            preferences: user.preferences,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging in',
        error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined,
      });
    }
  }
);

// Get user profile
router.get('/profile', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'bio', 'preferences'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    res.status(400).json({
      success: false,
      message: 'Invalid updates',
    });
    return;
  }

  try {
    updates.forEach((update) => {
      if (update === 'preferences') {
        req.user.preferences = {
          ...req.user.preferences,
          ...req.body.preferences,
        };
      } else {
        req.user[update] = req.body[update];
      }
    });
    await req.user.save();

    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating profile',
    });
  }
});

// Upload profile picture
router.post(
  '/profile/picture',
  auth as express.RequestHandler,
  upload.single('picture'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      const file = req.file;
      const key = `profile-pictures/${req.user._id}/${Date.now()}-${file.originalname}`;

      await S3Service.uploadFile(file, key);

      req.user.profilePicture = key;
      await req.user.save();

      res.status(200).json({
        success: true,
        data: {
          profilePicture: key,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error uploading profile picture',
      });
    }
  }
);

// Add experience to user
router.post('/experience', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid experience amount',
      });
      return;
    }

    await req.user.addExperience(amount);

    res.status(200).json({
      success: true,
      data: {
        level: req.user.level,
        experience: req.user.experience,
        achievements: req.user.achievements,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding experience',
    });
  }
});

// Get all users (admin only)
router.get(
  '/all',
  auth as express.RequestHandler,
  adminAuth as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await User.find().select('-password');
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
      });
    }
  }
);

// Update user role (admin only)
router.put(
  '/:userId/role',
  auth as express.RequestHandler,
  superAdminAuth as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { role } = req.body;
      const user = await User.findById(req.params.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      user.role = role;
      await user.save();

      res.json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user role',
      });
    }
  }
);

// Delete user (admin only)
router.delete(
  '/:userId',
  auth as express.RequestHandler,
  adminAuth as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findByIdAndDelete(req.params.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting user',
      });
    }
  }
);

export default router; 