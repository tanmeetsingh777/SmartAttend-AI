const Student = require("../models/Student");
const Class = require("../models/Class");
const AttendanceSession = require("../models/AttendanceSession");
const AttendanceRecord = require("../models/AttendanceRecord");
const { getAccessibleClassQuery } = require("../middleware/resourceAccess");
const AttendanceCorrectionRequest = require("../models/AttendanceCorrectionRequest");

exports.getDashboardStats = async (req, res, next) => {
  try {
    const classQuery = { isActive: true, ...getAccessibleClassQuery(req.user) };

    const classes = await Class.find(classQuery);
    const classIds = classes.map((c) => c._id);

    const totalClasses = classes.length;
    const departments = [
      ...new Set(
        classes.map((item) => item.departmentId?.toString()).filter(Boolean),
      ),
    ];
    const facultyIds = [
      ...new Set(
        classes.flatMap((item) => item.teacherIds.map((id) => id.toString())),
      ),
    ];
    const totalStudents = await Student.countDocuments({
      classId: { $in: classIds },
      isActive: true,
    });

    // Today's Date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaySessions = await AttendanceSession.find({
      classId: { $in: classIds },
      startedAt: { $gte: startOfDay, $lte: endOfDay },
    });
    const todaySessionIds = todaySessions.map((s) => s._id);

    const todayRecords = await AttendanceRecord.find({
      sessionId: { $in: todaySessionIds },
    });
    const scopedRecords = await AttendanceRecord.find({
      classId: { $in: classIds },
    }).select("studentId status");
    const studentAttendance = new Map();
    scopedRecords.forEach((record) => {
      const key = record.studentId.toString();
      const current = studentAttendance.get(key) || { total: 0, present: 0 };
      current.total += 1;
      if (record.status === "present") current.present += 1;
      studentAttendance.set(key, current);
    });
    const attendanceThreshold = Number(process.env.ATTENDANCE_THRESHOLD || 75);
    const lowAttendanceStudents = [...studentAttendance.values()].filter(
      (item) =>
        item.total > 0 &&
        (item.present / item.total) * 100 < attendanceThreshold,
    ).length;
    const scopedRecordIds = await AttendanceRecord.find({
      classId: { $in: classIds },
    }).select("_id");
    const pendingCorrectionRequests =
      await AttendanceCorrectionRequest.countDocuments({
        status: "pending",
        recordId: { $in: scopedRecordIds.map((item) => item._id) },
      });
    const todayPresent = todayRecords.filter(
      (r) => r.status === "present",
    ).length;
    const todayAbsent = todayRecords.filter(
      (r) => r.status === "absent",
    ).length;
    const todayLate = todayRecords.filter((r) => r.status === "late").length;

    const totalTodayMarked = todayRecords.length;
    const attendancePercentage =
      totalTodayMarked > 0
        ? parseFloat(((todayPresent / totalTodayMarked) * 100).toFixed(1))
        : 0;

    // Recent 5 attendance sessions
    const recentSessions = await AttendanceSession.find({
      classId: { $in: classIds },
    })
      .populate("classId", "name section subject")
      .populate("startedBy", "fullName")
      .sort({ startedAt: -1 })
      .limit(5);

    // Recent activity log
    const recentActivity = await AttendanceRecord.find({
      classId: { $in: classIds },
    })
      .populate("studentId", "rollNumber fullName")
      .populate("classId", "name section subject")
      .sort({ markedAt: -1 })
      .limit(10);

    // Attendance trend for last 7 days chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const chartRecords = await AttendanceRecord.find({
      classId: { $in: classIds },
      markedAt: { $gte: sevenDaysAgo },
    });

    const trendMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      trendMap[dateStr] = { date: dateStr, present: 0, absent: 0, late: 0 };
    }

    chartRecords.forEach((r) => {
      const dateStr = r.markedAt.toISOString().split("T")[0];
      if (trendMap[dateStr]) {
        if (r.status === "present") trendMap[dateStr].present++;
        else if (r.status === "absent") trendMap[dateStr].absent++;
        else if (r.status === "late") trendMap[dateStr].late++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalClasses,
        totalDepartments: departments.length,
        totalFaculty: facultyIds.length,
        totalSubjects: [
          ...new Set(classes.map((item) => item.subject).filter(Boolean)),
        ].length,
        attendanceThreshold,
        lowAttendanceStudents,
        pendingCorrectionRequests,
        todaySessionsCount: todaySessions.length,
        todayPresent,
        todayAbsent,
        todayLate,
        attendancePercentage,
        recentSessions,
        recentActivity,
        weeklyTrend: Object.values(trendMap),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const { classId, subject, studentId, startDate, endDate, status } =
      req.query;

    let query = {};
    const accessibleClasses = await Class.find(
      getAccessibleClassQuery(req.user),
    ).select("_id");
    const accessibleClassIds = accessibleClasses.map((item) =>
      item._id.toString(),
    );
    if (req.user.role !== "admin") {
      if (classId && !accessibleClassIds.includes(classId.toString()))
        return res
          .status(403)
          .json({
            success: false,
            message: "Report scope denied",
            code: "REPORT_ACCESS_DENIED",
          });
      query.classId = { $in: accessibleClasses.map((item) => item._id) };
    }
    if (classId) query.classId = classId;
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.markedAt = {};
      if (startDate) query.markedAt.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.markedAt.$lte = eDate;
      }
    }

    const records = await AttendanceRecord.find(query)
      .populate("studentId", "rollNumber fullName email")
      .populate("classId", "name section subject")
      .populate("sessionId", "subject startedAt")
      .sort({ markedAt: -1 });

    const totalRecords = records.length;
    const presentCount = records.filter((r) => r.status === "present").length;
    const absentCount = records.filter((r) => r.status === "absent").length;
    const lateCount = records.filter((r) => r.status === "late").length;
    const percentage =
      totalRecords > 0
        ? parseFloat(((presentCount / totalRecords) * 100).toFixed(1))
        : 0;

    res.status(200).json({
      success: true,
      data: {
        records,
        stats: {
          totalRecords,
          presentCount,
          absentCount,
          lateCount,
          attendancePercentage: percentage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.exportCSV = async (req, res, next) => {
  try {
    const { classId, startDate, endDate, status } = req.query;

    let query = {};
    const accessibleClasses = await Class.find(
      getAccessibleClassQuery(req.user),
    ).select("_id");
    const accessibleClassIds = accessibleClasses.map((item) =>
      item._id.toString(),
    );
    if (req.user.role !== "admin") {
      if (classId && !accessibleClassIds.includes(classId.toString()))
        return res
          .status(403)
          .json({
            success: false,
            message: "Report scope denied",
            code: "REPORT_ACCESS_DENIED",
          });
      query.classId = { $in: accessibleClasses.map((item) => item._id) };
    }
    if (classId) query.classId = classId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.markedAt = {};
      if (startDate) query.markedAt.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.markedAt.$lte = eDate;
      }
    }

    const records = await AttendanceRecord.find(query)
      .populate("studentId", "rollNumber fullName email")
      .populate("classId", "name section subject")
      .sort({ markedAt: -1 });

    let csvContent =
      "Roll Number,Student,Class,Subject,Date,Status,Source,Confidence\n";

    records.forEach((r) => {
      const roll = r.studentId ? `"${r.studentId.rollNumber}"` : "N/A";
      const name = r.studentId ? `"${r.studentId.fullName}"` : "N/A";
      const className = r.classId
        ? `"${r.classId.name} (${r.classId.section})"`
        : "N/A";
      const subject = r.classId ? `"${r.classId.subject}"` : "N/A";
      const date = `"${r.markedAt.toISOString().replace("T", " ").substring(0, 19)}"`;
      const stat = `"${r.status}"`;
      const src = `"${r.source}"`;
      const conf = `"${(r.confidence * 100).toFixed(1)}%"`;

      csvContent += `${roll},${name},${className},${subject},${date},${stat},${src},${conf}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="smartattend_report.csv"',
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
