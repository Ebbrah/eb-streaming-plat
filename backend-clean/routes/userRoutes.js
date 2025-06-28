const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Add request logging middleware
router.use((req, res, next) => {
    console.log('User route accessed:', {
        method: req.method,
        path: req.path,
        baseUrl: req.baseUrl,
        originalUrl: req.originalUrl,
        headers: req.headers,
        body: req.method === 'POST' ? { ...req.body, password: '[REDACTED]' } : undefined
    });
    next();
});

// Public routes (no auth required)
router.post('/register', async (req, res, next) => {
    try {
        console.log('Register route hit:', {
            method: req.method,
            path: req.path,
            body: { ...req.body, password: '[REDACTED]' }
        });
        await UserController.register(req, res);
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        await UserController.login(req, res);
    } catch (error) {
        next(error);
    }
});

// Protected routes (auth required)
router.get('/profile', auth, async (req, res, next) => {
    try {
        await UserController.getProfile(req, res);
    } catch (error) {
        next(error);
    }
});

module.exports = router; 