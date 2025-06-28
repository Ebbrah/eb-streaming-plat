import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  isSuperAdmin: boolean;
  profilePicture?: string;
  bio?: string;
  level: number;
  experience: number;
  watchlist: string[];
  watchHistory: Array<{
    movieId: string;
    progress: number;
    lastWatched: Date;
  }>;
  achievements: Array<{
    name: string;
    description: string;
    unlockedAt: Date;
  }>;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
  addExperience(amount: number): Promise<void>;
  isAdmin(): boolean;
  isSuperAdminUser(): boolean;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    level: {
      type: Number,
      default: 1,
    },
    experience: {
      type: Number,
      default: 0,
    },
    watchlist: [{
      type: String,
      ref: 'Movie',
    }],
    watchHistory: [{
      movieId: {
        type: String,
        ref: 'Movie',
      },
      progress: {
        type: Number,
        default: 0,
      },
      lastWatched: {
        type: Date,
        default: Date.now,
      },
    }],
    achievements: [{
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      unlockedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
      notifications: {
        type: Boolean,
        default: true,
      },
      language: {
        type: String,
        default: 'en',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user is admin
userSchema.methods.isAdmin = function(): boolean {
  return this.role === 'admin';
};

// Check if user is super admin
userSchema.methods.isSuperAdminUser = function(): boolean {
  return this.isSuperAdmin;
};

// Add experience and handle leveling up
userSchema.methods.addExperience = async function (amount: number): Promise<void> {
  this.experience += amount;
  
  // Level up formula: level = 1 + sqrt(experience / 100)
  const newLevel = Math.floor(1 + Math.sqrt(this.experience / 100));
  
  if (newLevel > this.level) {
    this.level = newLevel;
    // Add level up achievement
    this.achievements.push({
      name: `Level ${newLevel} Achieved!`,
      description: `Reached level ${newLevel}`,
      unlockedAt: new Date(),
    });
  }
  
  await this.save();
};

export const User = mongoose.model<IUser>('User', userSchema); 