const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// app.use('/uploads', express.static(uploadDir));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

console.log('��� Connecting to MongoDB Atlas...');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log(`��� Database: ${mongoose.connection.name}`);
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
});

// Routes
const studentRoutes = require('./routes/students');
const adminRoutes = require('./routes/admin');

app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Advance Computer Center API',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n��� Server running on http://localhost:${PORT}`);
    console.log(`��� API: http://localhost:${PORT}/api\n`);
});
