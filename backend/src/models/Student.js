const mongoose = require("mongoose");

const faceEnrollmentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["not_enrolled", "enrolled"],
      default: "not_enrolled",
    },
    embedding: { type: [Number], select: false }, // Sensitive 128-dim array, excluded from default queries
    modelName: { type: String, default: "OpenCV_YuNet_SFace" },
    modelVersion: { type: String, default: "1.0.0" },
    enrolledAt: { type: Date },
    updatedAt: { type: Date },
  },
  { _id: false },
);

const studentSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    enrollmentHistory: [
      {
        classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
        enrolledAt: { type: Date, default: Date.now },
        transferredAt: { type: Date },
        reason: { type: String, trim: true, default: "" },
      },
    ],
    isActive: { type: Boolean, default: true },
    faceEnrollment: {
      type: faceEnrollmentSchema,
      default: () => ({ status: "not_enrolled" }),
    },
  },
  { timestamps: true },
);

studentSchema.index({ classId: 1, isActive: 1 });

module.exports = mongoose.model("Student", studentSchema);
