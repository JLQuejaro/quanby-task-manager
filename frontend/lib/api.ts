import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with interceptor for auth token
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  googleCallback: async (idToken: string) => {
    const response = await api.post('/auth/google/callback', { idToken });
    return response.data;
  },

  hasPassword: async () => {
    const response = await api.get('/auth/has-password');
    return response.data;
  },

  // FIXED: Match backend DTO field names
  setPassword: async (password: string, passwordConfirm: string) => {
    console.log('🔐 Frontend API calling setPassword:', {
      passwordLength: password.length,
      passwordConfirmLength: passwordConfirm.length,
    });
    
    const response = await api.post('/auth/set-password', {
      password,
      passwordConfirm,
    });
    return response.data;
  },

  // FIXED: Match backend DTO field names
  changePassword: async (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm: string
  ) => {
    console.log('🔐 Frontend API calling changePassword:', {
      currentPasswordLength: currentPassword.length,
      newPasswordLength: newPassword.length,
      newPasswordConfirmLength: newPasswordConfirm.length,
    });

    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      newPasswordConfirm,
    });
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async () => {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

// Tasks API
export const tasksApi = {
  getAll: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  create: async (taskData: any) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  update: async (id: number, taskData: any) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  toggleComplete: async (id: number) => {
    const response = await api.patch(`/tasks/${id}/toggle`);
    return response.data;
  },
};

// Archive API
export const archiveApi = {
  getArchived: async () => {
    const response = await api.get('/tasks/archived');
    return response.data;
  },

  restore: async (id: number) => {
    const response = await api.post(`/tasks/archived/${id}/restore`);
    return response.data;
  },

  permanentlyDelete: async (id: number) => {
    const response = await api.delete(`/tasks/archived/${id}`);
    return response.data;
  },

  clearAll: async () => {
    const response = await api.delete('/tasks/archived');
    return response.data;
  },
};

export default api;