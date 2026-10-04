const mongoose = require("mongoose");

const academicTermSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    startsOn: { type: Date },
    endsOn: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

academicTermSchema.index({ academicYear: 1, semester: 1 }, { unique: true });
module.exports = mongoose.model("AcademicTerm", academicTermSchema);
