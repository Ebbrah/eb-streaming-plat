const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
    console.log('Incoming request:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        path: req.path,
        headers: req.headers,
        body: req.method === 'POST' ? { ...req.body, password: '[REDACTED]' } : undefined
    });
    next();
});

// MongoDB Connection with detailed logging
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/netflix-clone';
console.log('Attempting to connect to MongoDB:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Successfully connected to MongoDB');
    console.log('MongoDB connection state:', mongoose.connection.readyState);
})
.catch(err => {
    console.error('MongoDB connection error:', {
        message: err.message,
        name: err.name,
        stack: err.stack
    });
    process.exit(1); // Exit if cannot connect to database
});

// Log MongoDB connection events
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

// Routes
const movieRoutes = require('./routes/movieRoutes');
const userRoutes = require('./routes/userRoutes');
//const paymentRoutes = require('./routes/paymentRoutes');

// Add route logging
app.use((req, res, next) => {
    console.log('Route handling:', {
        method: req.method,
        url: req.url,
        path: req.path,
        baseUrl: req.baseUrl,
        originalUrl: req.originalUrl
    });
    next();
});

// Register routes with explicit paths
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);
//app.use('/api/payments', paymentRoutes);

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start HTTP server only
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
http.createServer(app).listen(PORT, HOST, () => {
    console.log(`HTTP Server running on ${HOST}:${PORT}`);
}); 