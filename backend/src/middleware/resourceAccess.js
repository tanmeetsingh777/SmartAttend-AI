const Class = require("../models/Class");
const AuditLog = require("../models/AuditLog");

const getAccessibleClassQuery = (user) => {
  if (user.role === "admin") return {};
  if (user.role === "hod")
    return { departmentId: { $in: user.departmentIds || [] } };

  const teacherAccess = [
    { teacherIds: user._id },
    { "facultyAssignments.teacherId": user._id },
  ];

  if (user.departmentIds && user.departmentIds.length > 0) {
    teacherAccess.push({ departmentId: { $in: user.departmentIds } });
  }

  return { $or: teacherAccess };
};

const loadAccessibleClass = async (req, res, next) => {
  const classId =
    req.params.classId ||
    req.params.id ||
    req.body.classId ||
    req.query.classId;
  if (!classId) return next();
  const classObj = await Class.findOne({
    _id: classId,
    ...getAccessibleClassQuery(req.user),
  });
  if (!classObj) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized for this class",
      code: "CLASS_ACCESS_DENIED",
    });
  }
  req.accessibleClass = classObj;
  next();
};

const assertClassAccess = async (classId, user) => {
  return Class.findOne({ _id: classId, ...getAccessibleClassQuery(user) });
};

const logAudit = (req, action, resource, resourceId, details = {}) =>
  AuditLog.create({
    actorId: req.user?._id,
    action,
    resource,
    resourceId,
    details,
    ipAddress: req.ip,
  }).catch(() => undefined);

module.exports = {
  getAccessibleClassQuery,
  loadAccessibleClass,
  assertClassAccess,
  logAudit,
};
