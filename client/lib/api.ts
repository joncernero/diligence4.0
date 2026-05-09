import axios from 'axios';

// In the browser, use the same hostname the app is served from (port 4000)
// so the API works regardless of which local IP address the machine has today.
// Falls back to env var (for production deployments) or localhost (for dev).
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:4000/api`
    : 'http://localhost:4000/api');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 errors (redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
};

// Users API
export const usersApi = {
  getMe: () => api.get('/users/me'),
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
};

// Projects API
export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id: number) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: number, data: any) => api.put(`/projects/${id}`, data),
};

// Properties API
export const propertiesApi = {
  getAll: () => api.get('/properties'),
  getById: (id: number) => api.get(`/properties/${id}`),
  getBuildings: (propertyId: number) =>
    api.get(`/properties/${propertyId}/buildings`),
  getUnits: (propertyId: number, buildingId: number) =>
    api.get(`/properties/${propertyId}/buildings/${buildingId}/units`),
  create: (data: any) => api.post('/properties', data),
  update: (id: number, data: any) => api.put(`/properties/${id}`, data),
  delete: (id: number) => api.delete(`/properties/${id}`),
};

// Walks API
export const walksApi = {
  getAll: (params?: any) => api.get('/walks', { params }),
  getById: (id: number) => api.get(`/walks/${id}`),
  create: (data: any) => api.post('/walks', data),
  update: (id: number, data: any) => api.put(`/walks/${id}`, data),
  delete: (id: number) => api.delete(`/walks/${id}`),
  export: (id: number, format: 'csv' | 'excel' | 'pdf') =>
    api.get(`/walks/${id}/export?format=${format}`, { responseType: 'blob' }),
};

// Observations API
export const observationsApi = {
  getAll: (params?: any) => api.get('/observations', { params }),
  getAssigned: (params?: any) => api.get('/observations/assigned', { params }),
  getById: (id: number) => api.get(`/observations/${id}`),
  create: (data: any) => api.post('/observations', data),
  update: (id: number, data: any) => api.put(`/observations/${id}`, data),
  addComment: (id: number, data: any) =>
    api.post(`/observations/${id}/comments`, data),
  addPhoto: (id: number, data: FormData) =>
    api.post(`/observations/${id}/photos`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Unit Types API
export const unitTypesApi = {
  getAll: (propertyId: number) =>
    api.get(`/unit-types?propertyId=${propertyId}`),
  getById: (id: number) => api.get(`/unit-types/${id}`),
  create: (data: any) => api.post('/unit-types', data),
  update: (id: number, data: any) => api.put(`/unit-types/${id}`, data),
  uploadFloorPlan: (id: number, formData: FormData) =>
    api.post(`/unit-types/${id}/floor-plan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  setBuildingCount: (id: number, data: any) =>
    api.post(`/unit-types/${id}/building-counts`, data),
};

// Scope API
export const scopeApi = {
  getAll: (projectId: number) => api.get(`/scope?projectId=${projectId}`),
  getById: (id: number) => api.get(`/scope/${id}`),
  create: (data: any) => api.post('/scope', data),
  update: (id: number, data: any) => api.put(`/scope/${id}`, data),
  delete: (id: number) => api.delete(`/scope/${id}`),
  linkObservation: (id: number, data: any) =>
    api.post(`/scope/${id}/link-observation`, data),
};

// CSI Codes API
export const csiCodesApi = {
  getAll: (params?: any) => api.get('/csi-codes', { params }),
};

// Tasks API
export const tasksApi = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  getById: (id: number) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: number, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
};

// Documents API
export const documentsApi = {
  getCategories: () => api.get('/documents/categories'),
  seedCategories: () => api.post('/documents/categories/seed'),
  getAll: (params?: any) => api.get('/documents', { params }),
  getById: (id: number) => api.get(`/documents/${id}`),
  upload: (formData: FormData) =>
    api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadNewVersion: (id: number, formData: FormData) =>
    api.post(`/documents/${id}/new-version`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: number, data: any) => api.put(`/documents/${id}`, data),
  delete: (id: number) => api.delete(`/documents/${id}`),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  clear: (id: number) => api.patch(`/push/notifications/${id}/clear`),
  clearAllRead: () => api.patch('/push/notifications/clear-all'),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data: any) => api.put('/notifications/preferences', data),
};

// Residents API
export const residentsApi = {
  invite: (data: any) => api.post('/residents/invite', data),
  bulkInvite: (data: any) => api.post('/residents/bulk-invite', data),
  validateInvite: (token: string) => api.get(`/residents/invite/${token}`),
  acceptInvite: (data: any) => api.post('/residents/accept-invite', data),
  getMe: () => api.get('/residents/me'),
  getAll: (params?: any) => api.get('/residents', { params }),
};

// Bulletins API
export const bulletinsApi = {
  getAll: (params?: any) => api.get('/bulletins', { params }),
  create: (data: any) => api.post('/bulletins', data),
  markRead: (id: number) => api.patch(`/bulletins/${id}/read`),
  archive: (id: number) => api.patch(`/bulletins/${id}/archive`),
  delete: (id: number) => api.delete(`/bulletins/${id}`),
};

// Work Schedules API
export const workSchedulesApi = {
  getAll: (params?: any) => api.get('/work-schedules', { params }),
  getResident: (params?: any) => api.get('/work-schedules/resident', { params }),
  getById: (id: number) => api.get(`/work-schedules/${id}`),
  create: (data: any) => api.post('/work-schedules', data),
  update: (id: number, data: any) => api.put(`/work-schedules/${id}`, data),
  delete: (id: number) => api.delete(`/work-schedules/${id}`),
};

// Approvals API
export const approvalsApi = {
  getAll: (params?: any) => api.get('/approvals', { params }),
  getById: (id: number) => api.get(`/approvals/${id}`),
  create: (data: any) => api.post('/approvals', data),
  update: (id: number, data: any) => api.put(`/approvals/${id}`, data),
  respond: (id: number, data: any) => api.put(`/approvals/${id}/respond`, data),
};

// Maintenance Requests API
export const maintenanceApi = {
  getMyRequests: (params?: any) => api.get('/maintenance', { params }),
  getAllRequests: (params?: any) => api.get('/maintenance/all', { params }),
  create: (data: any) => api.post('/maintenance', data),
  update: (id: number, data: any) => api.put(`/maintenance/${id}`, data),
  addPhoto: (id: number, formData: FormData) =>
    api.post(`/maintenance/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Push Notifications API
export const pushApi = {
  getVapidKey: () => api.get('/push/vapid-public-key'),
  subscribe: (subscription: any) => api.post('/push/subscribe', subscription),
  unsubscribe: (endpoint: string) => api.delete('/push/unsubscribe', { data: { endpoint } }),
};
