const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "smartattend_jwt_secret_key_2026",
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    },
  );
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide email and password",
          code: "MISSING_FIELDS",
        });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({
          success: false,
          message: "User account deactivated",
          code: "ACCOUNT_DEACTIVATED",
        });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        departmentIds: user.departmentIds || [],
        permissions: user.permissions || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        departmentIds: user.departmentIds || [],
        permissions: user.permissions || [],
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
