const User = require('../models/User.model'); // Ensure this path matches your User model file

// @desc    Get Students by Year and Semester (Filter)
// @route   GET /api/students?year=1&semester=2
// @access  Private (Teacher/Admin)
exports.getStudents = async (req, res, next) => {
  try {
    const { year, semester } = req.query;

    // 1. Base Query: Hamesha sirf 'student' role wale users dhundo
    let query = { role: 'student' };

    // 2. Agar frontend ne Year bheja hai, to filter mein add karo
    if (year) query.year = parseInt(year);

    // 3. Agar Semester bheja hai, to filter mein add karo
    if (semester) query.semester = parseInt(semester);

    // 4. Database Query
    const students = await User.find(query)
      .select('name email rollNo year semester') // Sirf ye fields chahiye (Password mat bhejna)
      .sort('rollNo'); // Roll number ke hisaab se sort karo

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Student by ID
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    next(error);
  }
};