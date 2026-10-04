const User = require("../models/User");
const Department = require("../models/Department");
const AuditLog = require("../models/AuditLog");
const { logAudit } = require("../middleware/resourceAccess");

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("departmentIds", "name code")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { fullName, email, password, role, departmentIds, permissions } =
      req.body;
    if (!fullName || !email || !password || !role)
      return res
        .status(400)
        .json({
          success: false,
          message: "Full name, email, password and role are required",
        });
    const user = await User.create({
      fullName,
      email,
      password,
      role,
      departmentIds,
      permissions,
    });
    await logAudit(req, "create", "user", user._id, { role });
    res
      .status(201)
      .json({
        success: true,
        data: await User.findById(user._id).select("-password"),
      });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const allowed = [
      "fullName",
      "role",
      "departmentIds",
      "permissions",
      "isActive",
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key)),
    );
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    await logAudit(req, "update", "user", user._id, updates);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.getDepartments = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await Department.find({ isActive: true }).sort({ name: 1 }),
    });
  } catch (error) {
    next(error);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const department = await Department.create({
      name: req.body.name,
      code: req.body.code,
    });
    await logAudit(req, "create", "department", department._id, {
      code: department.code,
    });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate("actorId", "fullName email role")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
