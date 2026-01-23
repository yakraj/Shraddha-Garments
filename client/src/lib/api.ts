import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<any, any>("/auth/login", { email, password }),
  register: (data: any) => api.post<any, any>("/auth/register", data),
  me: () => api.get<any, any>("/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<any, any>("/auth/change-password", { currentPassword, newPassword }),
};

// Users API
export const usersAPI = {
  getAll: (params?: any) => api.get<any, any>("/users", { params }),
  getById: (id: string) => api.get<any, any>(`/users/${id}`),
  update: (id: string, data: any) => api.put<any, any>(`/users/${id}`, data),
  delete: (id: string) => api.delete<any, any>(`/users/${id}`),
};

// Employees API
export const employeesAPI = {
  getAll: (params?: any) => api.get<any, any>("/employees", { params }),
  getById: (id: string) => api.get<any, any>(`/employees/${id}`),
  create: (data: any) => api.post<any, any>("/employees", data),
  update: (id: string, data: any) => api.put<any, any>(`/employees/${id}`, data),
  delete: (id: string) => api.delete<any, any>(`/employees/${id}`),
  getDepartments: () => api.get<any, any>("/employees/meta/departments"),
};

// Attendance API
export const attendanceAPI = {
  getAll: (params?: any) => api.get<any, any>("/attendance", { params }),
  getToday: () => api.get<any, any>("/attendance/today"),
  mark: (data: any) => api.post<any, any>("/attendance", data),
  bulkMark: (records: any[]) => api.post<any, any>("/attendance/bulk", { records }),
  getReport: (params: any) => api.get<any, any>("/attendance/report", { params }),
};

// Machines API
export const machinesAPI = {
  getAll: (params?: any) => api.get<any, any>("/machines", { params }),
  getById: (id: string) => api.get<any, any>(`/machines/${id}`),
  create: (data: any) => api.post<any, any>("/machines", data),
  update: (id: string, data: any) =>
    api.put<any, any>(`/machines/${id}`, data),
  delete: (id: string) => api.delete<any, any>(`/machines/${id}`),
  assign: (id: string, employeeId: string) =>
    api.post<any, any>(`/machines/${id}/assign`, { employeeId }),
  unassign: (id: string) => api.post<any, any>(`/machines/${id}/unassign`),
  addMaintenance: (id: string, data: any) =>
    api.post<any, any>(`/machines/${id}/maintenance`, data),
  getStatusSummary: () => api.get<any, any>("/machines/summary/status"),
};

// Materials API
export const materialsAPI = {
  getAll: (params?: any) => api.get<any, any>("/materials", { params }),
  getById: (id: string) => api.get<any, any>(`/materials/${id}`),
  create: (data: any) => api.post<any, any>("/materials", data),
  update: (id: string, data: any) =>
    api.put<any, any>(`/materials/${id}`, data),
  delete: (id: string) => api.delete<any, any>(`/materials/${id}`),
  addTransaction: (id: string, data: any) =>
    api.post<any, any>(`/materials/${id}/transaction`, data),
  getCategories: () => api.get<any, any>("/materials/meta/categories"),
  getSummary: () => api.get<any, any>("/materials/summary/inventory"),
};

// Customers API
export const customersAPI = {
  getAll: (params?: any) => api.get<any, any>("/customers", { params }),
  getById: (id: string) => api.get<any, any>(`/customers/${id}`),
  create: (data: any) => api.post<any, any>("/customers", data),
  update: (id: string, data: any) =>
    api.put<any, any>(`/customers/${id}`, data),
  delete: (id: string) => api.delete<any, any>(`/customers/${id}`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params?: any) => api.get<any, any>("/suppliers", { params }),
  getById: (id: string) => api.get<any, any>(`/suppliers/${id}`),
  create: (data: any) => api.post<any, any>("/suppliers", data),
  update: (id: string, data: any) =>
    api.put<any, any>(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete<any, any>(`/suppliers/${id}`),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params?: any) => api.get<any, any>("/invoices", { params }),
  getById: (id: string) => api.get<any, any>(`/invoices/${id}`),
  create: (data: any) => api.post<any, any>("/invoices", data),
  update: (id: string, data: any) => api.put<any, any>(`/invoices/${id}`, data),
  delete: (id: string) => api.delete<any, any>(`/invoices/${id}`),
  addPayment: (id: string, data: any) =>
    api.post<any, any>(`/invoices/${id}/payments`, data),
  getSummary: () => api.get<any, any>("/invoices/summary/stats"),
};

// Purchase Orders API
export const purchaseOrdersAPI = {
  getAll: (params?: any) => api.get<any, any>("/purchase-orders", { params }),
  getById: (id: string) => api.get<any, any>(`/purchase-orders/${id}`),
  create: (data: any) => api.post<any, any>("/purchase-orders", data),
  update: (id: string, data: any) =>
    api.put<any, any>(`/purchase-orders/${id}`, data),
  delete: (id: string) => api.delete<any, any>(`/purchase-orders/${id}`),
  receive: (id: string, items: any[]) =>
    api.post<any, any>(`/purchase-orders/${id}/receive`, { items }),
  approve: (id: string) => api.post<any, any>(`/purchase-orders/${id}/approve`),
  getSummary: () => api.get<any, any>("/purchase-orders/summary/stats"),
};

// Measurements API
export const measurementsAPI = {
  getAll: (params?: any) => api.get<any, any>("/measurements", { params }),
  getById: (id: string) => api.get<any, any>(`/measurements/${id}`),
  create: (data: any) => api.post<any, any>("/measurements", data),
  update: (id: string, data: any) =>
    api.put<any, any>(`/measurements/${id}`, data),
  delete: (id: string) => api.delete<any, any>(`/measurements/${id}`),
  getByCustomer: (customerId: string) =>
    api.get<any, any>(`/measurements/customer/${customerId}`),
  getGarmentTypes: () => api.get<any, any>("/measurements/meta/garment-types"),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get<any, any>("/analytics/dashboard"),
  getRevenue: (period?: number) =>
    api.get<any, any>("/analytics/revenue", { params: { period } }),
  getAttendance: (period?: number) =>
    api.get<any, any>("/analytics/attendance", { params: { period } }),
  getMachines: () => api.get<any, any>("/analytics/machines"),
  getInventory: () => api.get<any, any>("/analytics/inventory"),
  getProductivity: (period?: number) =>
    api.get<any, any>("/analytics/productivity", { params: { period } }),
  getFinancial: (year?: number) =>
    api.get<any, any>("/analytics/financial", { params: { year } }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params?: any) => api.get<any, any>("/notifications", { params }),
  markRead: (id: string) => api.put<any, any>(`/notifications/${id}/read`),
  markAllRead: () => api.put<any, any>("/notifications/read-all"),
  delete: (id: string) => api.delete<any, any>(`/notifications/${id}`),
  create: (data: any) => api.post<any, any>("/notifications", data),
  broadcast: (data: any) => api.post<any, any>("/notifications/broadcast", data),
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get<any, any>("/settings"),
  getByKey: (key: string) => api.get<any, any>(`/settings/${key}`),
  update: (key: string, value: any, description?: string) =>
    api.put<any, any>(`/settings/${key}`, { value, description }),
  bulkUpdate: (settings: Record<string, any>) =>
    api.put<any, any>("/settings", { settings }),
  getCompanyInfo: () => api.get<any, any>("/settings/company/info"),
};

// HSN API
export const hsnAPI = {
  getAll: () => api.get<any, any>("/hsn"),
  create: (data: { code: string; description?: string }) =>
    api.post<any, any>("/hsn", data),
  update: (id: string, data: { code: string; description?: string }) =>
    api.put<any, any>(`/hsn/${id}`, data),
  delete: (id: string) => api.delete<any, any>(`/hsn/${id}`),
};

// Fabrics API
export const fabricsAPI = {
  getAll: () => api.get<any, any>("/fabrics"),
  create: (formData: FormData) =>
    api.post<any, any>("/fabrics", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: string) => api.delete<any, any>(`/fabrics/${id}`),
};
