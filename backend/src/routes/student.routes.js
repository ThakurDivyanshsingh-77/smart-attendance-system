const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware'); // Token check middleware
const { getStudents, getStudent } = require('../controllers/student.controller');

// 🔥 Global Protection: Ye saare routes protected hain
router.use(protect);

// ==================================================
// ROUTES
// ==================================================

// 1. Get All Students (Filtered by Class)
// URL: /api/students?year=1&semester=2
// Access: Sirf Teachers aur Admins dekh sakte hain
router.get('/', authorize('teacher', 'admin'), getStudents);

// 2. Get Single Student Detail
// URL: /api/students/:id
router.get('/:id', authorize('teacher', 'admin'), getStudent);

module.exports = router;