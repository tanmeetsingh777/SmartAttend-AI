const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      index: true,
    },
    subject: { type: String, required: true, trim: true },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    settings: { type: Object, default: {} },
  },
  { timestamps: true },
);

attendanceSessionSchema.index({ classId: 1, startedAt: -1 });

module.exports = mongoose.model("AttendanceSession", attendanceSessionSchema);
