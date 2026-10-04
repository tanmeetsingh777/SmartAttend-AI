import api from './api';

export const classService = {
  async getAssignableTeachers() {
    const res = await api.get('/classes/teachers');
    return res.data;
  },

  async getClasses() {
    const res = await api.get('/classes');
    return res.data;
  },

  async getClassById(id) {
    const res = await api.get(`/classes/${id}`);
    return res.data;
  },

  async createClass(data) {
    const res = await api.post('/classes', data);
    return res.data;
  },

  async updateClass(id, data) {
    const res = await api.put(`/classes/${id}`, data);
    return res.data;
  },

  async deleteClass(id) {
    const res = await api.delete(`/classes/${id}`);
    return res.data;
  }
};
