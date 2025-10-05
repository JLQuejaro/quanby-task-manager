import axios from 'axios';
import { LoginCredentials, RegisterCredentials, AuthResponse, Task } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', credentials);
    return data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },
};

// Tasks API
export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    const { data } = await api.get('/tasks');
    return data;
  },

  getOne: async (id: number): Promise<Task> => {
    const { data } = await api.get(`/tasks/${id}`);
    return data;
  },

  create: async (task: Partial<Task>): Promise<Task> => {
    const { data } = await api.post('/tasks', task);
    return data;
  },

  update: async (id: number, task: Partial<Task>): Promise<Task> => {
    const { data } = await api.patch(`/tasks/${id}`, task);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  toggleComplete: async (id: number, completed: boolean): Promise<Task> => {
    const { data } = await api.patch(`/tasks/${id}`, { completed });
    return data;
  },
};

export default api;