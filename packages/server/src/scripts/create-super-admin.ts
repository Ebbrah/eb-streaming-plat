import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the correct .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@mana.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'superadmin123';
const SUPER_ADMIN_NAME = 'Super Admin';

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mana');

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('Super admin already exists');
      return;
    }

    // Create super admin
    const superAdmin = new User({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      name: SUPER_ADMIN_NAME,
      role: 'admin',
      isSuperAdmin: true,
    });

    await superAdmin.save();
    console.log('Super admin created successfully');
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSuperAdmin(); 