const mongoose = require("mongoose");

const correctionSchema = new mongoose.Schema(
  {
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceRecord",
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    requestedStatus: {
      type: String,
      enum: ["present", "absent", "late"],
      required: true,
    },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewNote: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "AttendanceCorrectionRequest",
  correctionSchema,
);
