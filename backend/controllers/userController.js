const User = require('../models/User');
const jwt = require('jsonwebtoken');

class UserController {
    // Register a new user
    static async register(req, res) {
        try {
            const { email, password, name } = req.body;

            // Log the incoming request data (excluding password)
            console.log('Registration attempt:', { email, name });

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
                name
            });

            // Log before saving
            console.log('Attempting to save user:', { email, name });

            await user.save();

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, role: user.role },
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
                { userId: user._id, role: user.role },
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
                    role: user.role
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
}

module.exports = UserController; 