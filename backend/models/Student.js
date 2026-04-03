const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    classTime: { type: String, enum: ['Morning', 'Day', 'Evening'], default: 'Day' },
    photoUrl: { type: String, default: '' },
    institution: { type: String, default: '' },
    fatherName: { type: String, default: '' },
    motherName: { type: String, default: '' },
    dobBS: { type: String, default: '' },
    maritalStatus: { type: String, default: '' },
    gender: { type: String, default: '' },
    birthPlace: { type: String, default: '' },
    qualification: { type: String, default: '' },
    nationality: { type: String, default: 'Nepali' },
    courseName: { type: String, required: true },
    courseDuration: { type: String, default: '' },
    contactNo: { type: String, required: true },
    email: { type: String, default: '' },
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    district: { type: String, default: '' },
    province: { type: String, default: '' },
    referBy: { type: String, default: '' },
    joinDate: { type: String, default: '' },
    signature: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);
