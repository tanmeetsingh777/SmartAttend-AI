const Class = require("../models/Class");
const Student = require("../models/Student");
const User = require("../models/User");
require("../models/Subject");
const {
  getAccessibleClassQuery,
  logAudit,
} = require("../middleware/resourceAccess");

exports.getAssignableTeachers = async (req, res, next) => {
  try {
    const query = { role: "teacher", isActive: true };
    if (req.user.role === "hod") {
      query.departmentIds = { $in: req.user.departmentIds || [] };
    }

    const teachers = await User.find(query)
      .select("fullName email departmentIds")
      .sort({ fullName: 1 });

    res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    next(error);
  }
};

exports.getClasses = async (req, res, next) => {
  try {
    const query = { isActive: true, ...getAccessibleClassQuery(req.user) };

    let classes = await Class.find(query)
      .populate("subjectIds", "name code")
      .populate("lectureOrder", "name code")
      .populate("facultyAssignments.teacherId", "fullName email role")
      .populate("facultyAssignments.subjectId", "name code")
      .sort({ createdAt: -1 });

    if (req.user.role === "teacher") {
      classes = classes.map((classObj) => {
        const data = classObj.toObject();
        const assignedSubjectIds = new Set(
          (data.facultyAssignments || [])
            .filter(
              (assignment) =>
                String(assignment.teacherId?._id || assignment.teacherId) ===
                String(req.user.id),
            )
            .map((assignment) =>
              String(assignment.subjectId?._id || assignment.subjectId),
            ),
        );
        if (assignedSubjectIds.size > 0) {
          data.subjectIds = data.subjectIds.filter((subjectItem) =>
            assignedSubjectIds.has(String(subjectItem._id)),
          );
          data.lectureOrder = data.lectureOrder.filter((subjectItem) =>
            assignedSubjectIds.has(String(subjectItem._id)),
          );
        }
        data.subject =
          data.lectureOrder[0]?.name ||
          data.subjectIds[0]?.name ||
          data.subject;
        return data;
      });
    }
    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

exports.getClassById = async (req, res, next) => {
  try {
    const classObj = await Class.findOne({
      _id: req.params.id,
      ...getAccessibleClassQuery(req.user),
    })
      .populate("teacherIds", "fullName email role")
      .populate("subjectIds", "name code")
      .populate("lectureOrder", "name code")
      .populate("facultyAssignments.teacherId", "fullName email role")
      .populate("facultyAssignments.subjectId", "name code");
    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
        code: "NOT_FOUND",
      });
    }

    const studentCount = await Student.countDocuments({
      classId: req.params.id,
      isActive: true,
    });
    const enrolledCount = await Student.countDocuments({
      classId: req.params.id,
      isActive: true,
      "faceEnrollment.status": "enrolled",
    });

    res.status(200).json({
      success: true,
      data: {
        ...classObj.toObject(),
        totalStudents: studentCount,
        enrolledStudents: enrolledCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createClass = async (req, res, next) => {
  try {
    const {
      name,
      section,
      academicYear,
      semester,
      course,
      classCode,
      capacity,
      departmentId,
      subject,
      subjectIds,
      lectureOrder,
      teacherIds,
      facultyAssignments,
    } = req.body;
    const effectiveDepartmentId =
      departmentId || (req.user.role === "hod" ? req.user.departmentIds?.[0] : undefined);

    // Default teacherIds to current user if teacher role
    let assignedTeachers = teacherIds || [];
    if (
      req.user.role === "teacher" &&
      !assignedTeachers.includes(req.user.id)
    ) {
      assignedTeachers.push(req.user.id);
    }
    if (
      req.user.role === "hod" &&
      (!effectiveDepartmentId ||
        !(req.user.departmentIds || []).some(
          (id) => String(id) === String(effectiveDepartmentId),
        ))
    ) {
      return res.status(403).json({
        success: false,
        message: "HODs may only create classes in assigned departments",
        code: "DEPARTMENT_ACCESS_DENIED",
      });
    }

    const newClass = await Class.create({
      name,
      section,
      academicYear,
      semester,
      course,
      classCode,
      capacity,
      departmentId: effectiveDepartmentId || undefined,
      subject,
      subjectIds,
      lectureOrder,
      teacherIds: assignedTeachers,
      facultyAssignments,
    });

    await logAudit(req, "create", "class", newClass._id, {
      name,
      departmentId: effectiveDepartmentId,
    });

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateClass = async (req, res, next) => {
  try {
    const {
      name,
      section,
      academicYear,
      semester,
      course,
      classCode,
      capacity,
      departmentId,
      subject,
      subjectIds,
      lectureOrder,
      teacherIds,
      facultyAssignments,
      isActive,
    } = req.body;
    let classObj = await Class.findOne({
      _id: req.params.id,
      ...getAccessibleClassQuery(req.user),
    });

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
        code: "NOT_FOUND",
      });
    }
    if (
      req.user.role === "hod" &&
      departmentId !== undefined &&
      !(req.user.departmentIds || []).some(
        (id) => String(id) === String(departmentId),
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "HODs may only manage assigned departments",
        code: "DEPARTMENT_ACCESS_DENIED",
      });
    }

    if (name) classObj.name = name;
    if (section) classObj.section = section;
    if (academicYear) classObj.academicYear = academicYear;
    if (semester !== undefined) classObj.semester = semester;
    if (course !== undefined) classObj.course = course;
    if (classCode !== undefined) classObj.classCode = classCode;
    if (capacity !== undefined) classObj.capacity = capacity;
    if (departmentId !== undefined) classObj.departmentId = departmentId;
    if (subject) classObj.subject = subject;
    if (subjectIds) classObj.subjectIds = subjectIds;
    if (lectureOrder) classObj.lectureOrder = lectureOrder;
    if (teacherIds) classObj.teacherIds = teacherIds;
    if (facultyAssignments) classObj.facultyAssignments = facultyAssignments;
    if (typeof isActive === "boolean") classObj.isActive = isActive;

    await classObj.save();
    await logAudit(req, "update", "class", classObj._id, { isActive });

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: classObj,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteClass = async (req, res, next) => {
  try {
    const classObj = await Class.findOne({
      _id: req.params.id,
      ...getAccessibleClassQuery(req.user),
    });
    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
        code: "NOT_FOUND",
      });
    }

    classObj.isActive = false;
    await classObj.save();
    await logAudit(req, "deactivate", "class", classObj._id);

    res.status(200).json({
      success: true,
      message: "Class deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};
