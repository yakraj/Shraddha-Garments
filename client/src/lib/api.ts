import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Create a customized Axios instance type that reflects our unwrapped response interceptor
interface CustomAxiosInstance extends Omit<
  AxiosInstance,
  "get" | "post" | "put" | "delete" | "patch"
> {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T>;
  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T>;
}

const apiInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiInstance.interceptors.request.use(
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
apiInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

const api = apiInstance as unknown as CustomAxiosInstance;
export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: any) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    }),
};

// Users API
export const usersAPI = {
  getAll: (params?: any) => api.get("/users", { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Employees API
export const employeesAPI = {
  getAll: (params?: any) => api.get("/employees", { params }),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post("/employees", data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  getDepartments: () => api.get("/employees/meta/departments"),
};

// Attendance API
export const attendanceAPI = {
  getAll: (params?: any) => api.get("/attendance", { params }),
  getToday: () => api.get("/attendance/today"),
  mark: (data: any) => api.post("/attendance", data),
  bulkMark: (records: any[]) => api.post("/attendance/bulk", { records }),
  getReport: (params: any) => api.get("/attendance/report", { params }),
};

// Machines API
export const machinesAPI = {
  getAll: (params?: any) => api.get("/machines", { params }),
  getById: (id: string) => api.get(`/machines/${id}`),
  create: (data: any) => api.post("/machines", data),
  update: (id: string, data: any) => api.put(`/machines/${id}`, data),
  delete: (id: string) => api.delete(`/machines/${id}`),
  assign: (id: string, employeeId: string) =>
    api.post(`/machines/${id}/assign`, { employeeId }),
  unassign: (id: string) => api.post(`/machines/${id}/unassign`),
  addMaintenance: (id: string, data: any) =>
    api.post(`/machines/${id}/maintenance`, data),
  getStatusSummary: () => api.get("/machines/summary/status"),
};

// Materials API
export const materialsAPI = {
  getAll: (params?: any) => api.get("/materials", { params }),
  getById: (id: string) => api.get(`/materials/${id}`),
  create: (data: any) => api.post("/materials", data),
  update: (id: string, data: any) => api.put(`/materials/${id}`, data),
  delete: (id: string) => api.delete(`/materials/${id}`),
  addTransaction: (id: string, data: any) =>
    api.post(`/materials/${id}/transaction`, data),
  getCategories: () => api.get("/materials/meta/categories"),
  getSummary: () => api.get("/materials/summary/inventory"),
};

// Customers API
export const customersAPI = {
  getAll: (params?: any) => api.get("/customers", { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post("/customers", data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params?: any) => api.get("/suppliers", { params }),
  getById: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post("/suppliers", data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params?: any) => api.get("/invoices", { params }),
  getById: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post("/invoices", data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  addPayment: (id: string, data: any) =>
    api.post(`/invoices/${id}/payments`, data),
  getSummary: () => api.get("/invoices/summary/stats"),
};

// Purchase Orders API
export const purchaseOrdersAPI = {
  getAll: (params?: any) => api.get("/purchase-orders", { params }),
  getById: (id: string) => api.get(`/purchase-orders/${id}`),
  create: (data: any) => api.post("/purchase-orders", data),
  update: (id: string, data: any) => api.put(`/purchase-orders/${id}`, data),
  delete: (id: string) => api.delete(`/purchase-orders/${id}`),
  receive: (id: string, items: any[]) =>
    api.post(`/purchase-orders/${id}/receive`, { items }),
  approve: (id: string) => api.post(`/purchase-orders/${id}/approve`),
  getSummary: () => api.get("/purchase-orders/summary/stats"),
};

// Measurements API
export const measurementsAPI = {
  getAll: (params?: any) => api.get("/measurements", { params }),
  getById: (id: string) => api.get(`/measurements/${id}`),
  create: (data: any) => api.post("/measurements", data),
  update: (id: string, data: any) => api.put(`/measurements/${id}`, data),
  delete: (id: string) => api.delete(`/measurements/${id}`),
  getByCustomer: (customerId: string) =>
    api.get(`/measurements/customer/${customerId}`),
  getGarmentTypes: () => api.get("/measurements/meta/garment-types"),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get("/analytics/dashboard"),
  getRevenue: (period?: number) =>
    api.get("/analytics/revenue", { params: { period } }),
  getAttendance: (period?: number) =>
    api.get("/analytics/attendance", { params: { period } }),
  getMachines: () => api.get("/analytics/machines"),
  getInventory: () => api.get("/analytics/inventory"),
  getProductivity: (period?: number) =>
    api.get("/analytics/productivity", { params: { period } }),
  getFinancial: (year?: number) =>
    api.get("/analytics/financial", { params: { year } }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params?: any) => api.get("/notifications", { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  create: (data: any) => api.post("/notifications", data),
  broadcast: (data: any) => api.post("/notifications/broadcast", data),
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get("/settings"),
  getByKey: (key: string) => api.get(`/settings/${key}`),
  update: (key: string, value: any, description?: string) =>
    api.put(`/settings/${key}`, { value, description }),
  bulkUpdate: (settings: Record<string, any>) =>
    api.put("/settings", { settings }),
  getCompanyInfo: () => api.get("/settings/company/info"),
};

// HSN API
export const hsnAPI = {
  getAll: () => api.get("/hsn"),
  create: (data: { code: string; description?: string }) =>
    api.post("/hsn", data),
  update: (id: string, data: { code: string; description?: string }) =>
    api.put(`/hsn/${id}`, data),
  delete: (id: string) => api.delete(`/hsn/${id}`),
};

// Fabrics API
export const fabricsAPI = {
  getAll: () => api.get("/fabrics"),
  create: (formData: FormData) =>
    api.post("/fabrics", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: string) => api.delete(`/fabrics/${id}`),
};
