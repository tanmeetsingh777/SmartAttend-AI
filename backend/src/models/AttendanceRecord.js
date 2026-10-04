const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true, index: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
  source: { type: String, enum: ['face', 'manual'], default: 'face' },
  markedAt: { type: Date, default: Date.now },
  confidence: { type: Number, default: 1.0 },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, trim: true, default: '' }
}, { timestamps: true });

// CRITICAL UNIQUE CONSTRAINT: Prevents same student from being marked twice in same session
attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
