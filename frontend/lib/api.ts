import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with interceptor for auth token
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests - with browser check
api.interceptors.request.use((config) => {
  // Only access localStorage in browser environment
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Log the error details for debugging
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method,
      });
    }
    return Promise.reject(error);
  }
);

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
    try {
      console.log('📦 Fetching archived tasks...');
      const response = await api.get('/tasks/archived/all');
      console.log('✅ Archived tasks fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch archived tasks:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  restore: async (id: number) => {
    try {
      console.log(`🔄 Restoring task ${id}...`);
      const response = await api.post(`/tasks/archived/${id}/restore`);
      console.log('✅ Task restored successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to restore task ${id}:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  permanentlyDelete: async (id: number) => {
    try {
      console.log(`🗑️ Permanently deleting task ${id}...`);
      const response = await api.delete(`/tasks/archived/${id}`);
      console.log('✅ Task permanently deleted:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to delete task ${id}:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  clearAll: async () => {
    try {
      console.log('🗑️ Clearing all archived tasks...');
      const response = await api.delete('/tasks/archived/clear-all/all');
      console.log('✅ All archived tasks cleared:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to clear archived tasks:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },
};

export default api;