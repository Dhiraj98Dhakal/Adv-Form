const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// Auth middleware
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'advance_computer_center_secret_key_2025');
        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Public: Register student
router.post('/register', upload.single('photo'), async (req, res) => {
    try {
        let studentData;
        if (req.body.studentData) {
            studentData = JSON.parse(req.body.studentData);
        } else {
            studentData = req.body;
        }
        
        const student = new Student(studentData);
        if (req.file) {
            student.photoUrl = `/uploads/${req.file.filename}`;
        }
        
        await student.save();
        res.status(201).json({ message: 'Student registered successfully', student });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ message: 'Error registering student', error: error.message });
    }
});

// Admin: Get all students
router.get('/', auth, async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students' });
    }
});

// Admin: Get single student
router.get('/:id', auth, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student' });
    }
});

// Admin: Delete student
router.delete('/:id', auth, async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting student' });
    }
});

module.exports = router;
