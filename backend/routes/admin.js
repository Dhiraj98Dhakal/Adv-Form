const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');

// Initialize default admin
const initAdmin = async () => {
    try {
        const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@advancecenter.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
            const admin = new Admin({
                email: process.env.ADMIN_EMAIL || 'admin@advancecenter.com',
                password: hashedPassword,
                name: 'Super Admin'
            });
            await admin.save();
            console.log('✅ Default admin created');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
};

setTimeout(() => {
    initAdmin();
}, 2000);

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const admin = await Admin.findOne({ email });
        
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: admin._id, email: admin.email },
            process.env.JWT_SECRET || 'advance_computer_center_secret_key_2025',
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );
        
        res.json({ token, admin: { id: admin._id, email: admin.email, name: admin.name } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login error', error: error.message });
    }
});

// Verify token
router.get('/verify', (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ valid: false });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'advance_computer_center_secret_key_2025');
        res.json({ valid: true, admin: decoded });
    } catch (err) {
        res.status(401).json({ valid: false });
    }
});

module.exports = router;
