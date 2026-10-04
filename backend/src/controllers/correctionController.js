const AttendanceCorrectionRequest = require("../models/AttendanceCorrectionRequest");
const AttendanceRecord = require("../models/AttendanceRecord");
const { assertClassAccess } = require("../middleware/resourceAccess");

exports.createRequest = async (req, res, next) => {
  try {
    const record = await AttendanceRecord.findById(req.body.recordId);
    if (!record || !(await assertClassAccess(record.classId, req.user)))
      return res
        .status(403)
        .json({ success: false, message: "Attendance record access denied" });
    const request = await AttendanceCorrectionRequest.create({
      recordId: record._id,
      requestedBy: req.user._id,
      requestedStatus: req.body.requestedStatus,
      reason: req.body.reason,
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

exports.getRequests = async (req, res, next) => {
  try {
    const requests = await AttendanceCorrectionRequest.find({
      status: "pending",
    })
      .populate({
        path: "recordId",
        populate: [
          { path: "classId", select: "name section departmentId" },
          { path: "studentId", select: "fullName rollNumber" },
        ],
      })
      .populate("requestedBy", "fullName email")
      .sort({ createdAt: -1 });
    const visible = [];
    for (const request of requests)
      if (
        request.recordId &&
        (await assertClassAccess(request.recordId.classId._id, req.user))
      )
        visible.push(request);
    res.json({ success: true, data: visible });
  } catch (error) {
    next(error);
  }
};

exports.reviewRequest = async (req, res, next) => {
  try {
    const request = await AttendanceCorrectionRequest.findById(
      req.params.id,
    ).populate("recordId");
    if (
      !request ||
      !(await assertClassAccess(request.recordId.classId, req.user))
    )
      return res
        .status(403)
        .json({ success: false, message: "Correction access denied" });
    request.status = req.body.status;
    request.reviewedBy = req.user._id;
    request.reviewNote = req.body.reviewNote || "";
    await request.save();
    if (request.status === "approved")
      await AttendanceRecord.findByIdAndUpdate(request.recordId._id, {
        status: request.requestedStatus,
        markedBy: req.user._id,
        source: "manual",
      });
    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};
