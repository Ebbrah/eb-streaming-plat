const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                message: 'Please authenticate',
                success: false 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Add user from payload
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ 
            message: 'Please authenticate',
            success: false 
        });
    }
};

module.exports = auth; 