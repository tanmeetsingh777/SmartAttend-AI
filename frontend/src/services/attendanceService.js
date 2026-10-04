import api from "./api";

export const attendanceService = {
  async startSession(classId, subject, subjectId) {
    const res = await api.post("/attendance/sessions", {
      classId,
      subject,
      subjectId,
    });
    return res.data;
  },

  async getSessions(params = {}) {
    const res = await api.get("/attendance/sessions", { params });
    return res.data;
  },

  async getSessionById(id) {
    const res = await api.get(`/attendance/sessions/${id}`);
    return res.data;
  },

  async recognizeFrame(sessionId, imageBase64) {
    const res = await api.post(`/attendance/sessions/${sessionId}/recognize`, {
      image: imageBase64,
    });
    return res.data;
  },

  async manualAttendance(sessionId, studentId, status, notes = "") {
    const res = await api.post(`/attendance/sessions/${sessionId}/manual`, {
      studentId,
      status,
      notes,
    });
    return res.data;
  },

  async updateRecord(recordId, status, notes = "") {
    const res = await api.put(`/attendance/records/${recordId}`, {
      status,
      notes,
    });
    return res.data;
  },

  async finalizeSession(sessionId, markUnmarkedAsAbsent = true) {
    const res = await api.post(`/attendance/sessions/${sessionId}/finalize`, {
      markUnmarkedAsAbsent,
    });
    return res.data;
  },
};
