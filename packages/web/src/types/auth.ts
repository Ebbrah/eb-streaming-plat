export type UserRole = 'user' | 'admin';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  isSuperAdmin: boolean;
  bio?: string;
  profilePicture?: string;
  level: number;
  experience: number;
  achievements: Array<{
    name: string;
    description: string;
    unlockedAt: string;
  }>;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
} 