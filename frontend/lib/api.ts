// frontend/lib/api.ts

import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with interceptor for auth token
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests - with browser check
api.interceptors.request.use(
  (config) => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;
      
      console.error('API Error Response:', {
        status,
        statusText: error.response.statusText,
        data,
        url: error.config?.url,
        method: error.config?.method,
      });

      // Handle specific status codes
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register') {
            window.location.href = '/login?error=Session expired. Please login again.';
          }
        }
      } else if (status === 403) {
        console.error('Forbidden: You do not have permission to access this resource');
      } else if (status === 404) {
        console.error('Not Found: The requested resource does not exist');
      } else if (status >= 500) {
        console.error('Server Error: Please try again later');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Error: No response received', {
        url: error.config?.url,
        method: error.config?.method,
        message: 'The server did not respond. Please check if the backend is running.',
      });
      
      // Check if backend is running
      if (typeof window !== 'undefined' && error.message === 'Network Error') {
        console.error('❌ Backend might not be running. Make sure the server is running on ' + API_URL);
      }
    } else {
      // Something else happened
      console.error('API Error:', {
        message: error.message,
        name: error.name,
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    try {
      const response = await api.post('/auth/register', { email, password, name });
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  login: async (email: string, password: string, rememberMe?: boolean) => {
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  googleCallback: async (idToken: string) => {
    try {
      const response = await api.post('/auth/google/callback', { idToken });
      return response.data;
    } catch (error) {
      console.error('Google callback error:', error);
      throw error;
    }
  },

  hasPassword: async () => {
    try {
      const response = await api.get('/auth/has-password');
      return response.data;
    } catch (error) {
      console.error('Has password check error:', error);
      throw error;
    }
  },

  setPassword: async (password: string, passwordConfirm: string) => {
    try {
      console.log('🔐 Frontend API calling setPassword');
      const response = await api.post('/auth/set-password', {
        password,
        passwordConfirm,
      });
      return response.data;
    } catch (error) {
      console.error('Set password error:', error);
      throw error;
    }
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm: string
  ) => {
    try {
      console.log('🔐 Frontend API calling changePassword');
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        newPasswordConfirm,
      });
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  verifyEmail: async (token: string) => {
    try {
      const response = await api.post('/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  },

  resendVerification: async () => {
    try {
      const response = await api.post('/auth/resend-verification');
      return response.data;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  deleteAccount: async (password?: string) => {
    try {
      const response = await api.delete('/auth/account', {
        data: { password } // DELETE requests send body in 'data' property
      });
      return response.data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  },
};

// Tasks API
export const tasksApi = {
  getAll: async () => {
    try {
      console.log('📋 Fetching all tasks...');
      const response = await api.get('/tasks');
      console.log('✅ Tasks fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch tasks');
      
      // Provide more helpful error messages
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error('Cannot connect to server. Make sure backend is running on ' + API_URL);
      } else if (error.response?.status === 401) {
        throw new Error('Not authenticated. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('Tasks endpoint not found. Check backend routes.');
      }
      
      throw error;
    }
  },

  getById: async (id: number) => {
    try {
      console.log(`📋 Fetching task ${id}...`);
      const response = await api.get(`/tasks/${id}`);
      console.log('✅ Task fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch task ${id}`);
      throw error;
    }
  },

  create: async (taskData: any) => {
    try {
      console.log('➕ Creating task...', taskData);
      const response = await api.post('/tasks', taskData);
      console.log('✅ Task created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create task');
      throw error;
    }
  },

  update: async (id: number, taskData: any) => {
    try {
      console.log(`✏️ Updating task ${id}...`, taskData);
      const response = await api.patch(`/tasks/${id}`, taskData);
      console.log('✅ Task updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to update task', id);
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      console.log(`🗑️ Deleting task ${id}...`);
      const response = await api.delete(`/tasks/${id}`);
      console.log('✅ Task deleted successfully');
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to delete task ${id}`);
      throw error;
    }
  },

  toggleComplete: async (id: number) => {
    try {
      console.log(`✓ Toggling task ${id} completion...`);
      const response = await api.patch(`/tasks/${id}/toggle`);
      console.log('✅ Task toggled successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to toggle task ${id}`);
      throw error;
    }
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
      console.error('❌ Failed to fetch archived tasks');
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
      console.error(`❌ Failed to restore task ${id}`);
      throw error;
    }
  },

  permanentlyDelete: async (id: number) => {
    try {
      console.log(`🗑️ Permanently deleting task ${id}...`);
      const response = await api.delete(`/tasks/archived/${id}`);
      console.log('✅ Task permanently deleted');
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to delete task ${id}`);
      throw error;
    }
  },

  clearAll: async () => {
    try {
      console.log('🗑️ Clearing all archived tasks...');
      const response = await api.delete('/tasks/archived/clear-all/all');
      console.log('✅ All archived tasks cleared');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to clear archived tasks');
      throw error;
    }
  },
};

export default api;