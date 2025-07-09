const User = require('../models/User');
const jwt = require('jsonwebtoken');

class UserController {
    // Register a new user
    static async register(req, res) {
        try {
            const { email, password, name, role, mobileNumber } = req.body;

            // Log the incoming request data (excluding password)
            console.log('Registration attempt:', { email, name, role, mobileNumber });

            // Validate required fields
            if (!email || !password || !name) {
                console.log('Missing required fields:', { email: !!email, password: !!password, name: !!name });
                return res.status(400).json({ 
                    message: 'All fields are required',
                    success: false 
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                console.log('User already exists:', email);
                return res.status(400).json({ 
                    message: 'User already exists',
                    success: false 
                });
            }

            // Create new user
            const user = new User({
                email,
                password,
                name,
                mobileNumber,
                role: role || 'user' // Default to 'user' if no role specified
            });

            // Log before saving
            console.log('Attempting to save user:', { email, name, role: user.role, mobileNumber });

            await user.save();

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, role: user.role, isSuperAdmin: user.isSuperAdmin },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                success: true,
                data: {
                    token,
                    user: {
                        id: user._id,
                        email: user.email,
                        name: user.name,
                        mobileNumber: user.mobileNumber,
                        role: user.role
                    }
                }
            });
        } catch (error) {
            console.error('Registration error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            res.status(500).json({ 
                message: 'Error creating user',
                success: false,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Login user
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ 
                    message: 'Invalid credentials',
                    success: false 
                });
            }

            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ 
                    message: 'Invalid credentials',
                    success: false 
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, role: user.role, isSuperAdmin: user.isSuperAdmin },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                success: true,
                data: {
                    token,
                    user: {
                        id: user._id,
                        email: user.email,
                        name: user.name,
                        role: user.role
                    }
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                message: 'Error logging in',
                success: false 
            });
        }
    }

    // Get user profile
    static async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.userId).select('-password');
            if (!user) {
                return res.status(404).json({
                    message: 'User not found',
                    success: false
                });
            }

            res.json({
                success: true,
                data: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    mobileNumber: user.mobileNumber,
                    role: user.role,
                    isSuperAdmin: user.isSuperAdmin || false
                }
            });
        } catch (error) {
            console.error('Profile error:', error);
            res.status(500).json({
                message: 'Error fetching profile',
                success: false
            });
        }
    }

    // Get all users (admin only)
    static async getAllUsers(req, res) {
        try {
            // Only allow admins
            if (!req.user || (req.user.role !== 'admin' && !req.user.isSuperAdmin)) {
                return res.status(403).json({ message: 'Forbidden', success: false });
            }
            const users = await User.find({}, '-password');
            res.json({ success: true, data: users });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ message: 'Error fetching users', success: false });
        }
    }

    // Update user role (admin only)
    static async updateUserRole(req, res) {
        try {
            // Only allow super admins
            if (!req.user || !req.user.isSuperAdmin) {
                return res.status(403).json({ message: 'Forbidden', success: false });
            }

            const { role } = req.body;
            const { userId } = req.params;

            // Validate role
            if (!['user', 'admin'].includes(role)) {
                return res.status(400).json({ 
                    message: 'Invalid role. Must be "user" or "admin"',
                    success: false 
                });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ 
                    message: 'User not found',
                    success: false 
                });
            }

            // Prevent changing super admin role
            if (user.isSuperAdmin) {
                return res.status(403).json({ 
                    message: 'Cannot modify super admin role',
                    success: false 
                });
            }

            user.role = role;
            await user.save();

            res.json({
                success: true,
                data: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Error updating user role:', error);
            res.status(500).json({ 
                message: 'Error updating user role',
                success: false 
            });
        }
    }

    // Delete user (admin only)
    static async deleteUser(req, res) {
        try {
            // Only allow super admins
            if (!req.user || !req.user.isSuperAdmin) {
                return res.status(403).json({ message: 'Forbidden', success: false });
            }

            const { userId } = req.params;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ 
                    message: 'User not found',
                    success: false 
                });
            }

            // Prevent deleting super admins
            if (user.isSuperAdmin) {
                return res.status(403).json({ 
                    message: 'Cannot delete super admin',
                    success: false 
                });
            }

            await User.findByIdAndDelete(userId);

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ 
                message: 'Error deleting user',
                success: false 
            });
        }
    }
}

module.exports = UserController; 