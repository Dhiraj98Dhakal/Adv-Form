const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    // Basic Information
    fullName: { type: String, required: true },
    classTime: { type: String, enum: ['Morning', 'Day', 'Evening'], default: 'Day' },
    photoUrl: { type: String, default: '' },
    
    // Personal Information
    institution: { type: String, default: '' },
    fatherName: { type: String, default: '' },
    motherName: { type: String, default: '' },
    dobBS: { type: String, default: '' },
    maritalStatus: { type: String, default: '' },
    gender: { type: String, default: '' },
    birthPlace: { type: String, default: '' },
    qualification: { type: String, default: '' },
    nationality: { type: String, default: 'Nepali' },
    
    // Course Details
    courseName: { type: String, required: true },
    courseDuration: { type: String, default: '' },
    
    // Contact Information
    contactNo: { type: String, required: true },
    email: { type: String, default: '' },
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    district: { type: String, default: '' },
    province: { type: String, default: '' },
    
    // Additional Info
    referBy: { type: String, default: '' },
    joinDate: { type: String, default: '' },
    signature: { type: String, default: '' },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);