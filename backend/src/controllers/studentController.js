const Student = require("../models/Student");
const Class = require("../models/Class");
const AttendanceRecord = require("../models/AttendanceRecord");
const { enrollFace } = require("../services/aiService");
const {
  getAccessibleClassQuery,
  assertClassAccess,
  logAudit,
} = require("../middleware/resourceAccess");

exports.getStudents = async (req, res, next) => {
  try {
    const { classId, search, status } = req.query;
    let query = req.query.includeInactive === "true" ? {} : { isActive: true };

    if (classId) {
      const accessibleClass = await assertClassAccess(classId, req.user);
      if (!accessibleClass)
        return res
          .status(403)
          .json({
            success: false,
            message: "You are not authorized for this class",
            code: "CLASS_ACCESS_DENIED",
          });
      query.classId = classId;
    } else if (req.user.role !== "admin") {
      const accessibleClasses = await Class.find(
        getAccessibleClassQuery(req.user),
      ).select("_id");
      query.classId = { $in: accessibleClasses.map((item) => item._id) };
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "enrolled") {
      query["faceEnrollment.status"] = "enrolled";
    } else if (status === "not_enrolled") {
      query["faceEnrollment.status"] = "not_enrolled";
    }

    const students = await Student.find(query)
      .populate("classId", "name section subject academicYear")
      .sort({ rollNumber: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "classId",
      "name section subject academicYear departmentId teacherIds",
    );
    if (!student) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Student not found",
          code: "NOT_FOUND",
        });
    }
    if (
      req.user.role !== "admin" &&
      !(await assertClassAccess(
        student.classId._id || student.classId,
        req.user,
      ))
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized for this student",
          code: "STUDENT_ACCESS_DENIED",
        });
    }

    // Attendance stats
    const totalRecords = await AttendanceRecord.countDocuments({
      studentId: student._id,
    });
    const presentRecords = await AttendanceRecord.countDocuments({
      studentId: student._id,
      status: "present",
    });
    const percentage =
      totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : 0;

    const recentAttendance = await AttendanceRecord.find({
      studentId: student._id,
    })
      .populate("sessionId", "subject startedAt")
      .sort({ markedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        ...student.toObject(),
        stats: {
          totalClasses: totalRecords,
          presentClasses: presentRecords,
          attendancePercentage: parseFloat(percentage),
        },
        recentAttendance,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    const { rollNumber, fullName, email, classId } = req.body;

    if (!rollNumber || !fullName || !email || !classId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Roll number, full name, email, and class ID are required",
          code: "MISSING_FIELDS",
        });
    }

    const existingRoll = await Student.findOne({
      rollNumber: rollNumber.trim(),
    });
    if (existingRoll) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Roll number '${rollNumber}' is already registered`,
          code: "DUPLICATE_ROLL",
        });
    }

    const targetClass = await Class.findById(classId);
    if (!targetClass) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Selected class does not exist",
          code: "CLASS_NOT_FOUND",
        });
    }
    if (
      req.user.role !== "admin" &&
      !(await assertClassAccess(classId, req.user))
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized for this class",
          code: "CLASS_ACCESS_DENIED",
        });
    }

    const student = await Student.create({
      rollNumber: rollNumber.trim(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      classId,
      faceEnrollment: { status: "not_enrolled" },
    });

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const { rollNumber, fullName, email, classId, isActive } = req.body;
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Student not found",
          code: "NOT_FOUND",
        });
    }

    if (rollNumber && rollNumber.trim() !== student.rollNumber) {
      const existing = await Student.findOne({
        rollNumber: rollNumber.trim(),
        _id: { $ne: student._id },
      });
      if (existing) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Roll number '${rollNumber}' already taken`,
            code: "DUPLICATE_ROLL",
          });
      }
      student.rollNumber = rollNumber.trim();
    }

    if (fullName) student.fullName = fullName.trim();
    if (email) student.email = email.trim().toLowerCase();
    if (classId && String(classId) !== String(student.classId)) {
      if (
        !(await assertClassAccess(student.classId, req.user)) ||
        !(await assertClassAccess(classId, req.user))
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message: "You are not authorized for this transfer",
            code: "CLASS_ACCESS_DENIED",
          });
      }
      student.enrollmentHistory.push({
        classId: student.classId,
        transferredAt: new Date(),
        reason: "Transferred to another class",
      });
      student.enrollmentHistory.push({ classId, enrolledAt: new Date() });
      student.classId = classId;
    }
    if (typeof isActive === "boolean") student.isActive = isActive;

    await student.save();
    await logAudit(req, "update", "student", student._id, { classId });

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Student not found",
          code: "NOT_FOUND",
        });
    }

    student.isActive = false;
    await student.save();
    await logAudit(req, "deactivate", "student", student._id);

    res.status(200).json({
      success: true,
      message: "Student deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.restoreStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student)
      return res
        .status(404)
        .json({
          success: false,
          message: "Student not found",
          code: "NOT_FOUND",
        });
    if (
      req.user.role !== "admin" &&
      !(await assertClassAccess(student.classId, req.user))
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized for this student",
          code: "STUDENT_ACCESS_DENIED",
        });
    }
    student.isActive = true;
    await student.save();
    await logAudit(req, "restore", "student", student._id);
    res
      .status(200)
      .json({
        success: true,
        message: "Student restored successfully",
        data: student,
      });
  } catch (error) {
    next(error);
  }
};

// Facial enrollment endpoint
exports.enrollStudentFace = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { image } = req.body; // Base64 encoded image from webcam

    if (!image) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Camera frame image is required",
          code: "MISSING_IMAGE",
        });
    }

    const student = await Student.findById(studentId);
    if (!student || !student.isActive) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Active student not found",
          code: "STUDENT_NOT_FOUND",
        });
    }
    if (
      req.user.role !== "admin" &&
      !(await assertClassAccess(student.classId, req.user))
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized for this student",
          code: "STUDENT_ACCESS_DENIED",
        });
    }

    // Call Python FastAPI AI Service
    const aiResult = await enrollFace(image);

    if (!aiResult.success) {
      return res.status(400).json({
        success: false,
        message: aiResult.message || "Face enrollment failed validation",
        code: "AI_VALIDATION_FAILED",
      });
    }

    // Store real embedding vector in database
    student.faceEnrollment = {
      status: "enrolled",
      embedding: aiResult.embedding,
      modelName: aiResult.modelName || "OpenCV_YuNet_SFace",
      modelVersion: aiResult.modelVersion || "1.0.0",
      enrolledAt: new Date(),
      updatedAt: new Date(),
    };

    await student.save();

    res.status(200).json({
      success: true,
      message: "Face enrolled successfully!",
      data: {
        studentId: student._id,
        rollNumber: student.rollNumber,
        fullName: student.fullName,
        enrollmentStatus: "enrolled",
        modelName: student.faceEnrollment.modelName,
        enrolledAt: student.faceEnrollment.enrolledAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudentEnrollment = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Student not found",
          code: "NOT_FOUND",
        });
    }
    if (
      req.user.role !== "admin" &&
      !(await assertClassAccess(student.classId, req.user))
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized for this student",
          code: "STUDENT_ACCESS_DENIED",
        });
    }

    res.status(200).json({
      success: true,
      data: {
        status: student.faceEnrollment?.status || "not_enrolled",
        modelName: student.faceEnrollment?.modelName || null,
        modelVersion: student.faceEnrollment?.modelVersion || null,
        enrolledAt: student.faceEnrollment?.enrolledAt || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteStudentEnrollment = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Student not found",
          code: "NOT_FOUND",
        });
    }
    if (
      req.user.role !== "admin" &&
      !(await assertClassAccess(student.classId, req.user))
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized for this student",
          code: "STUDENT_ACCESS_DENIED",
        });
    }

    student.faceEnrollment = {
      status: "not_enrolled",
      embedding: undefined,
      modelName: "OpenCV_YuNet_SFace",
      modelVersion: "1.0.0",
      updatedAt: new Date(),
    };

    await student.save();

    res.status(200).json({
      success: true,
      message:
        "Face enrollment deleted successfully. Student account remains active.",
    });
  } catch (error) {
    next(error);
  }
};
