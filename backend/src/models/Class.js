const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    semester: { type: String, trim: true, default: "" },
    course: { type: String, trim: true, default: "" },
    classCode: { type: String, trim: true, index: true },
    capacity: { type: Number, min: 1, default: 60 },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },
    subject: { type: String, required: true, trim: true },
    subjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    lectureOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    teacherIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ],
    facultyAssignments: [
      {
        teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

classSchema.index({ name: 1, section: 1, subject: 1 });
classSchema.index({
  departmentId: 1,
  academicYear: 1,
  semester: 1,
  isActive: 1,
});

module.exports = mongoose.model("Class", classSchema);
