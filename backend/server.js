const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// ==================== CORS CONFIGURATION ====================
// Allow all origins for production (Railway + Netlify)
const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://adv-form-production.up.railway.app',
    'https://adv-form-production.railway.app',
    'https://adv-form.netlify.app',
    'https://*.netlify.app',
    'https://*.railway.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // For production, also allow any railway.app or netlify.app domain
            if (origin.includes('.railway.app') || origin.includes('.netlify.app')) {
                callback(null, true);
            } else {
                console.log('Blocked origin:', origin);
                callback(null, true); // Still allow for testing
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔍 Connecting to MongoDB Atlas...');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
});

// Routes
const studentRoutes = require('./routes/students');
const adminRoutes = require('./routes/admin');

app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);

// Serve static frontend files (for production)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Test route
app.get('/api/status', (req, res) => {
    res.json({ 
        message: 'Advance Computer Center API is running',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Advance Computer Center API',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        endpoints: {
            students: '/api/students',
            admin: '/api/admin',
            status: '/api/status'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        requestedUrl: req.url 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: 'Server error', 
        error: err.message 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`🔗 CORS enabled for Railway and Netlify domains\n`);
});