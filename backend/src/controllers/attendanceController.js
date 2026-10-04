const AttendanceSession = require("../models/AttendanceSession");
const AttendanceRecord = require("../models/AttendanceRecord");
const Student = require("../models/Student");
const Class = require("../models/Class");
const {
  assertClassAccess,
  getAccessibleClassQuery,
  logAudit,
} = require("../middleware/resourceAccess");
const { recognizeFace } = require("../services/aiService");

exports.startSession = async (req, res, next) => {
  try {
    const { classId, subject, subjectId } = req.body;

    if (!classId || !subject) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Class ID and subject are required",
          code: "MISSING_FIELDS",
        });
    }

    const classObj = await Class.findById(classId);
    if (!classObj || !classObj.isActive) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Class not found or inactive",
          code: "CLASS_NOT_FOUND",
        });
    }
    if (!(await assertClassAccess(classId, req.user))) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized for this class",
          code: "CLASS_ACCESS_DENIED",
        });
    }
    if (req.user.role === "teacher" && subjectId) {
      const assigned = (classObj.facultyAssignments || []).some(
        (item) =>
          String(item.teacherId) === String(req.user.id) &&
          String(item.subjectId) === String(subjectId),
      );
      if (!assigned)
        return res
          .status(403)
          .json({
            success: false,
            message: "You are not assigned to this lecture",
            code: "SUBJECT_ACCESS_DENIED",
          });
    }

    // Deactivate any currently active session for this class by this teacher
    await AttendanceSession.updateMany(
      { classId, startedBy: req.user.id, status: "active" },
      { status: "completed", endedAt: new Date() },
    );

    const session = await AttendanceSession.create({
      classId,
      subjectId,
      subject,
      startedBy: req.user.id,
      startedAt: new Date(),
      status: "active",
    });
    await logAudit(req, "start", "attendance_session", session._id, {
      classId,
      subject,
    });

    res.status(201).json({
      success: true,
      message: "Attendance session started",
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSessions = async (req, res, next) => {
  try {
    const { classId, status } = req.query;
    let query = {};

    if (classId) query.classId = classId;
    if (status) query.status = status;
    if (req.user.role !== "admin") {
      const accessibleClasses = await Class.find(
        getAccessibleClassQuery(req.user),
      ).select("_id");
      const accessibleIds = accessibleClasses.map((item) =>
        item._id.toString(),
      );
      if (classId && !accessibleIds.includes(classId.toString())) {
        return res
          .status(403)
          .json({
            success: false,
            message: "You are not authorized for this class",
            code: "CLASS_ACCESS_DENIED",
          });
      }
      query.classId = classId || {
        $in: accessibleClasses.map((item) => item._id),
      };
    }

    const sessions = await AttendanceSession.find(query)
      .populate("classId", "name section subject")
      .populate("startedBy", "fullName email")
      .sort({ startedAt: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSessionById = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate("classId", "name section subject academicYear")
      .populate("startedBy", "fullName email");

    if (!session) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Attendance session not found",
          code: "NOT_FOUND",
        });
    }
    if (!(await assertClassAccess(session.classId, req.user))) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized for this session",
          code: "SESSION_ACCESS_DENIED",
        });
    }

    const records = await AttendanceRecord.find({ sessionId: session._id })
      .populate("studentId", "rollNumber fullName email faceEnrollment.status")
      .sort({ markedAt: -1 });

    const totalClassStudents = await Student.countDocuments({
      classId: session.classId._id,
      isActive: true,
    });
    const presentCount = records.filter((r) => r.status === "present").length;
    const absentCount = records.filter((r) => r.status === "absent").length;
    const lateCount = records.filter((r) => r.status === "late").length;

    res.status(200).json({
      success: true,
      data: {
        session,
        records,
        summary: {
          totalClassStudents,
          presentCount,
          absentCount,
          lateCount,
          unmarkedCount: Math.max(
            0,
            totalClassStudents - (presentCount + absentCount + lateCount),
          ),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.recognizeAndMarkAttendance = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const { image } = req.body; // Base64 frame from frontend camera

    if (!image) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Image frame is required",
          code: "MISSING_IMAGE",
        });
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Attendance session not found",
          code: "SESSION_NOT_FOUND",
        });
    }
    if (!(await assertClassAccess(session.classId, req.user))) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized for this session",
          code: "SESSION_ACCESS_DENIED",
        });
    }

    if (session.status !== "active") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Attendance session is no longer active",
          code: "SESSION_CLOSED",
        });
    }

    // Retrieve active students for this session's class WITH their embeddings (internal server retrieval only)
    const studentsWithEmbeddings = await Student.find({
      classId: session.classId,
      isActive: true,
      "faceEnrollment.status": "enrolled",
    }).select("+faceEnrollment.embedding");

    if (studentsWithEmbeddings.length === 0) {
      return res.status(200).json({
        success: true,
        status: "no_enrolled_students",
        message:
          "No enrolled students in this class. Please enroll face data first.",
        matchedStudent: null,
      });
    }

    // Format candidate list for AI service
    const candidates = studentsWithEmbeddings.map((s) => ({
      studentId: s._id.toString(),
      embedding: s.faceEnrollment.embedding,
    }));

    // Call Python FastAPI AI Service
    const aiResult = await recognizeFace(image, candidates);

    if (!aiResult.success || !aiResult.matchedStudentId) {
      return res.status(200).json({
        success: true,
        status: aiResult.status || "unknown",
        confidence: aiResult.confidence || 0,
        message: aiResult.message || "Face not recognized",
        matchedStudent: null,
      });
    }

    // Match identified!
    const student = await Student.findById(aiResult.matchedStudentId);
    if (!student || !student.isActive) {
      return res.status(200).json({
        success: true,
        status: "invalid_student",
        message: "Recognized student is inactive or removed",
        matchedStudent: null,
      });
    }

    // Check if already marked present in this session
    const existingRecord = await AttendanceRecord.findOne({
      sessionId: session._id,
      studentId: student._id,
    });

    if (existingRecord) {
      return res.status(200).json({
        success: true,
        status: "already_marked",
        confidence: aiResult.confidence,
        message: `${student.fullName} (Roll: ${student.rollNumber}) is already marked present.`,
        matchedStudent: {
          id: student._id,
          rollNumber: student.rollNumber,
          fullName: student.fullName,
        },
        record: existingRecord,
      });
    }

    // Create new attendance record
    try {
      const newRecord = await AttendanceRecord.create({
        sessionId: session._id,
        classId: session.classId,
        studentId: student._id,
        status: "present",
        source: "face",
        markedAt: new Date(),
        confidence: aiResult.confidence,
        markedBy: req.user.id,
      });

      return res.status(201).json({
        success: true,
        status: "marked_present",
        confidence: aiResult.confidence,
        message: `Attendance marked for ${student.fullName} (Roll: ${student.rollNumber})`,
        matchedStudent: {
          id: student._id,
          rollNumber: student.rollNumber,
          fullName: student.fullName,
        },
        record: newRecord,
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return res.status(200).json({
          success: true,
          status: "already_marked",
          message: `${student.fullName} already marked present.`,
          matchedStudent: {
            id: student._id,
            rollNumber: student.rollNumber,
            fullName: student.fullName,
          },
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

exports.manualAttendance = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const { studentId, status, notes } = req.body;

    if (!studentId || !status) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Student ID and status are required",
          code: "MISSING_FIELDS",
        });
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Attendance session not found",
          code: "SESSION_NOT_FOUND",
        });
    }
    if (!(await assertClassAccess(session.classId, req.user))) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized for this session",
          code: "SESSION_ACCESS_DENIED",
        });
    }

    const record = await AttendanceRecord.findOneAndUpdate(
      { sessionId: session._id, studentId },
      {
        classId: session.classId,
        status,
        source: "manual",
        markedAt: new Date(),
        markedBy: req.user.id,
        notes: notes || "Manual edit by teacher",
      },
      { new: true, upsert: true },
    ).populate("studentId", "rollNumber fullName email");

    res.status(200).json({
      success: true,
      message: "Attendance record updated manually",
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRecord = async (req, res, next) => {
  try {
    const { id: recordId } = req.params;
    const { status, notes } = req.body;

    const record = await AttendanceRecord.findById(recordId);
    if (!record) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Attendance record not found",
          code: "NOT_FOUND",
        });
    }
    if (!(await assertClassAccess(record.classId, req.user))) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized for this attendance record",
          code: "RECORD_ACCESS_DENIED",
        });
    }

    if (status) record.status = status;
    if (notes !== undefined) record.notes = notes;
    record.source = "manual";
    record.markedBy = req.user.id;

    await record.save();

    res.status(200).json({
      success: true,
      message: "Record updated",
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

exports.finalizeSession = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const { markUnmarkedAsAbsent } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Attendance session not found",
          code: "NOT_FOUND",
        });
    }
    if (!(await assertClassAccess(session.classId, req.user))) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized for this session",
          code: "SESSION_ACCESS_DENIED",
        });
    }

    session.status = "completed";
    session.endedAt = new Date();
    await session.save();

    // If requested, mark all active class students who were not recognized as 'absent'
    if (markUnmarkedAsAbsent) {
      const allClassStudents = await Student.find({
        classId: session.classId,
        isActive: true,
      });
      const markedRecords = await AttendanceRecord.find({
        sessionId: session._id,
      });
      const markedStudentIds = new Set(
        markedRecords.map((r) => r.studentId.toString()),
      );

      const absentOps = [];
      for (const student of allClassStudents) {
        if (!markedStudentIds.has(student._id.toString())) {
          absentOps.push({
            sessionId: session._id,
            classId: session.classId,
            studentId: student._id,
            status: "absent",
            source: "manual",
            markedBy: req.user.id,
            notes: "Auto-marked absent on session finalization",
          });
        }
      }

      if (absentOps.length > 0) {
        await AttendanceRecord.insertMany(absentOps, { ordered: false }).catch(
          (err) => {
            // Ignore duplicate errors if any
          },
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Attendance session finalized successfully",
    });
  } catch (error) {
    next(error);
  }
};
