// User types
export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  hasPassword?: boolean;
  authProvider?: 'email' | 'google';
}

// Task types
export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
  completed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// API Response types
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Filter types
export type TaskFilter = 'all' | 'today' | 'tomorrow' | 'upcoming' | 'completed' | 'overdue';

// Stats types
export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}
