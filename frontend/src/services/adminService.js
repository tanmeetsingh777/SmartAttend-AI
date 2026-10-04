import api from "./api";

export const adminService = {
  async getUsers() {
    const response = await api.get("/admin/users");
    return response.data;
  },
  async getDepartments() {
    const response = await api.get("/admin/departments");
    return response.data;
  },
  async getAuditLogs() {
    const response = await api.get("/admin/audit-logs");
    return response.data;
  },
};
