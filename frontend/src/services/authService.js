import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('smartattend_token', response.data.token);
      localStorage.setItem('smartattend_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore server logout errors
    } finally {
      localStorage.removeItem('smartattend_token');
      localStorage.removeItem('smartattend_user');
    }
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('smartattend_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
};
