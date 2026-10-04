import api from "./api";

export const studentService = {
  async getStudents(params = {}) {
    const res = await api.get("/students", { params });
    return res.data;
  },

  async getStudentById(id) {
    const res = await api.get(`/students/${id}`);
    return res.data;
  },

  async createStudent(data) {
    const res = await api.post("/students", data);
    return res.data;
  },

  async updateStudent(id, data) {
    const res = await api.put(`/students/${id}`, data);
    return res.data;
  },

  async deleteStudent(id) {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  },

  async restoreStudent(id) {
    const res = await api.patch(`/students/${id}/restore`);
    return res.data;
  },

  async enrollFace(studentId, imageBase64) {
    const res = await api.post(`/students/${studentId}/enrollment`, {
      image: imageBase64,
    });
    return res.data;
  },

  async getEnrollment(studentId) {
    const res = await api.get(`/students/${studentId}/enrollment`);
    return res.data;
  },

  async deleteEnrollment(studentId) {
    const res = await api.delete(`/students/${studentId}/enrollment`);
    return res.data;
  },
};
