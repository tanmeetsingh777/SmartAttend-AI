import api from './api';

export const reportService = {
  async getDashboardStats() {
    const res = await api.get('/reports/dashboard');
    return res.data;
  },

  async getReports(params = {}) {
    const res = await api.get('/reports/attendance', { params });
    return res.data;
  },

  async exportCSV(params = {}) {
    const res = await api.get('/reports/attendance/export', {
      params,
      responseType: 'blob'
    });
    // Create download link
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smartattend_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
