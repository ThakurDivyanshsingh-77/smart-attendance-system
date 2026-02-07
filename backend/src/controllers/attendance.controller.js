const AttendanceSession = require('../models/AttendanceSession.model');
const AttendanceRecord = require('../models/AttendanceRecord.model');
const Subject = require('../models/Subject.model');
const User = require('../models/User.model'); // Ensure path is correct
const socketService = require('../services/socket.service');

// ==========================================
// TEACHER CONTROLLERS
// ==========================================

// @desc    Start Attendance Session
exports.startSession = async (req, res, next) => {
  try {
    const { subjectId, year, semester } = req.body;
    const teacherId = req.user._id;

    // 1. Check existing active session
    const existingSession = await AttendanceSession.findOne({
      subject: subjectId,
      isActive: true,
      isExpired: false
    });

    if (existingSession) {
      await existingSession.populate('subject', 'name code');
      return res.status(200).json({
        success: true,
        message: 'Active session retrieved',
        session: {
          id: existingSession._id.toString(),
          sessionCode: existingSession.sessionCode,
          subject: existingSession.subject,
          startTime: existingSession.startTime,
          expiryTime: existingSession.expiryTime,
          year: existingSession.year,
          semester: existingSession.semester
        }
      });
    }

    // 2. Validate Subject
    const subject = await Subject.findOne({ 
      _id: subjectId, 
      year, 
      semester,
      isActive: true 
    });

    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    // 3. Generate Unique 4-Digit Code
    let sessionCode;
    let isUnique = false;
    while (!isUnique) {
      sessionCode = Math.floor(1000 + Math.random() * 9000).toString();
      const existing = await AttendanceSession.findOne({ sessionCode, isActive: true });
      if (!existing) isUnique = true;
    }

    // 4. Create Session
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); 
    const session = await AttendanceSession.create({
      teacher: teacherId,
      subject: subjectId,
      sessionCode,
      year,
      semester,
      expiryTime
    });

    await session.populate('subject', 'name code');

    res.status(201).json({
      success: true,
      message: 'Attendance session started',
      session: {
        id: session._id.toString(),
        sessionCode: session.sessionCode,
        subject: session.subject,
        startTime: session.startTime,
        expiryTime: session.expiryTime,
        year: session.year,
        semester: session.semester
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Active Session
exports.getActiveSession = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const teacherId = req.user._id;

    const session = await AttendanceSession.findOne({
      teacher: teacherId,
      subject: subjectId,
      isActive: true,
      isExpired: false
    }).populate('subject', 'name code');

    if (!session) return res.status(404).json({ success: false, message: 'No active session' });

    if (new Date() > session.expiryTime) {
      session.isExpired = true;
      session.isActive = false;
      await session.save();
      return res.status(400).json({ success: false, message: 'Session expired' });
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

// @desc    End Session
exports.endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user._id;

    const session = await AttendanceSession.findOne({ _id: sessionId, teacher: teacherId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.isActive = false;
    session.isExpired = true;
    await session.save();

    res.status(200).json({ success: true, message: 'Session ended' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Live Attendance
exports.getLiveAttendance = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user._id;

    const session = await AttendanceSession.findOne({ _id: sessionId, teacher: teacherId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const records = await AttendanceRecord.find({ session: sessionId })
      .populate('student', 'name rollNumber')
      .sort('-markedAt');

    res.status(200).json({
      success: true,
      count: records.length,
      records: records.map(r => ({
        studentName: r.student?.name || 'Unknown',
        rollNumber: r.student?.rollNumber || 'N/A',
        markedAt: r.markedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Teacher History
exports.getTeacherAttendanceHistory = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const { subjectId, startDate, endDate, year, semester } = req.query;

    let query = { teacher: teacherId };

    if (subjectId) query.subject = subjectId;
    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await AttendanceSession.find(query)
      .populate('subject', 'name code')
      .sort({ startTime: -1 })
      .limit(100)
      .lean();

    if (!sessions.length) {
      return res.status(200).json({ success: true, sessions: [] });
    }

    const sessionIds = sessions.map(s => s._id);
    const records = await AttendanceRecord.find({ session: { $in: sessionIds } })
      .populate('student', 'name email rollNo')
      .lean();

    const sessionsWithData = sessions.map(session => {
      const sessionRecords = records.filter(
        r => r.session.toString() === session._id.toString()
      );

      return {
        ...session,
        attendanceRecords: sessionRecords,
        totalPresent: sessionRecords.length
      };
    });

    res.status(200).json({ success: true, sessions: sessionsWithData });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Subject Stats
exports.getSubjectStats = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const teacherId = req.user._id;

    const totalSessions = await AttendanceSession.countDocuments({
      teacher: teacherId, subject: subjectId, isExpired: true
    });

    const records = await AttendanceRecord.find({ subject: subjectId })
      .populate('student', 'name rollNumber');

    const studentAttendance = {};
    records.forEach(record => {
      const sid = record.student._id.toString();
      if (!studentAttendance[sid]) {
        studentAttendance[sid] = {
          name: record.student.name,
          rollNumber: record.student.rollNumber,
          present: 0
        };
      }
      studentAttendance[sid].present += 1;
    });

    const studentStats = Object.values(studentAttendance).map(s => ({
      ...s,
      total: totalSessions,
      percentage: totalSessions > 0 ? ((s.present / totalSessions) * 100).toFixed(2) : 0
    }));

    res.status(200).json({ success: true, totalSessions, studentStats });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// STUDENT CONTROLLERS
// ==========================================

// @desc    Get Active Sessions
exports.getActiveSessionsForStudent = async (req, res, next) => {
  try {
    const student = await User.findById(req.user._id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const sessions = await AttendanceSession.find({
      year: student.year,
      semester: student.semester,
      isActive: true,
      isExpired: false,
      expiryTime: { $gt: new Date() }
    }).populate('subject', 'name code').populate('teacher', 'name');

    res.status(200).json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    next(error);
  }
};

// 🔥🔥🔥 STRICT MARK ATTENDANCE (Checks Year/Sem) 🔥🔥🔥
exports.markAttendance = async (req, res, next) => {
  try {
    const { sessionCode } = req.body;
    const studentId = req.user._id;

    // 1. Student Fetch (Humein Student ka Year/Sem chahiye)
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // 2. Session Find
    const session = await AttendanceSession.findOne({
      sessionCode, isActive: true, isExpired: false
    }).populate('subject');

    if (!session) return res.status(404).json({ success: false, message: 'Invalid or Expired Code' });

    // 🔥🔥 SECURITY CHECK: Kya ye session Student ke Year/Sem ke liye hai? 🔥🔥
    if (session.year !== student.year || session.semester !== student.semester) {
      return res.status(403).json({ 
        success: false, 
        message: `This session is for Year ${session.year}, Sem ${session.semester}. You are in Year ${student.year}.` 
      });
    }

    if (new Date() > session.expiryTime) {
      session.isExpired = true;
      session.isActive = false;
      await session.save();
      return res.status(400).json({ success: false, message: 'Session expired' });
    }

    // 3. Check Duplicate
    const existing = await AttendanceRecord.findOne({ student: studentId, session: session._id });
    if (existing) return res.status(400).json({ success: false, message: 'Already marked for this session' });

    // 4. Create Record
    const record = await AttendanceRecord.create({
      student: studentId,
      session: session._id,
      subject: session.subject._id,
      markedAt: new Date()
    });

    await record.populate('student', 'name rollNumber');

    if (socketService) {
      socketService.emitAttendanceMarked(session._id.toString(), {
        studentName: record.student.name,
        rollNumber: record.student.rollNumber,
        markedAt: record.markedAt
      });
    }

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      record: { subject: session.subject.name, markedAt: record.markedAt }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Student History
exports.getStudentAttendanceHistory = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { subjectId } = req.query;

    let query = { student: studentId };
    if (subjectId) query.subject = subjectId;

    const records = await AttendanceRecord.find(query)
      .populate('subject', 'name code')
      .populate('session', 'startTime')
      .sort('-markedAt')
      .limit(100);

    res.status(200).json({
      success: true,
      count: records.length,
      records: records.map(r => ({
        id: r._id,
        subject: r.subject,
        markedAt: r.markedAt,
        sessionDate: r.session ? r.session.startTime : null
      }))
    });
  } catch (error) {
    next(error);
  }
};

// 🔥🔥🔥 STRICT STUDENT STATS (Filters by Year/Sem) 🔥🔥🔥
exports.getStudentStats = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const student = await User.findById(studentId).lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Parallel Execution
    const [totalClasses, presentCount] = await Promise.all([
      // 1. Count Total Sessions ONLY for Student's Year & Sem
      AttendanceSession.countDocuments({
        year: student.year,         // Strict Filter
        semester: student.semester, // Strict Filter
        // expiryTime: { $lt: new Date() } // Optional: Sirf past sessions ginne hain to ye un-comment karein
      }),
      // 2. Count Present Records for this Student
      AttendanceRecord.countDocuments({
        student: studentId
      })
    ]);

    let percentage = 0;
    if (totalClasses > 0) {
      percentage = Math.round((presentCount / totalClasses) * 100);
    }

    res.status(200).json({
      success: true,
      totalClasses: totalClasses,
      present: presentCount,
      absent: totalClasses - presentCount,
      percentage: percentage
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    next(error);
  }
};

// @desc NEW: Get Student Reports
exports.getStudentSubjectReports = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // 1. Get Subjects for Student's Year/Sem
    const subjects = await Subject.find({
      year: student.year,
      semester: student.semester,
      isActive: true
    });

    // 2. Calculate Stats per Subject
    const reportData = await Promise.all(subjects.map(async (subject) => {
      
      // Total Sessions for this Subject (Strictly for this year/sem)
      const totalSessions = await AttendanceSession.countDocuments({
        subject: subject._id,
        year: student.year,
        semester: student.semester
      });

      // Total Present
      const totalPresent = await AttendanceRecord.countDocuments({
        student: studentId,
        subject: subject._id
      });

      let percentage = 0;
      if (totalSessions > 0) {
        percentage = Math.round((totalPresent / totalSessions) * 100);
      }

      return {
        subjectName: subject.name,
        subjectCode: subject.code,
        totalClasses: totalSessions,
        attended: totalPresent,
        percentage: percentage,
        status: percentage >= 75 ? 'Good' : 'Low'
      };
    }));

    res.status(200).json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    next(error);
  }
};