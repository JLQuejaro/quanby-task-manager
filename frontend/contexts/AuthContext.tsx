'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  googleLogin: (credential: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  checkPasswordStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user has set a password
  const checkPasswordStatus = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`${API_URL}/api/auth/has-password`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.hasPassword;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to check password status:', error);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // Check if user is already logged in
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Check password status
          const hasPassword = await checkPasswordStatus();
          
          setUser({ ...parsedUser, hasPassword });
          console.log('✅ User loaded from localStorage:', parsedUser.email);
          console.log('🔑 Password status:', hasPassword ? 'Set' : 'Not set');
          
          // Redirect to password setup if needed
          const publicPaths = ['/login', '/register', '/forgot-password', '/auth/callback', '/callback', '/set-password'];
          const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
          
          if (!hasPassword && !isPublicPath) {
            console.log('⚠️ Password not set, redirecting to setup page');
            router.push('/set-password');
          }
        } catch (error) {
          console.error('❌ Error parsing stored user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [pathname, router]);

  // Protect routes
  useEffect(() => {
    if (!isLoading && !user) {
      const publicPaths = ['/login', '/register', '/forgot-password', '/auth/callback', '/callback'];
      const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
      
      if (!isPublicPath) {
        console.log('⚠️ No user found, redirecting to login');
        router.push('/login');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('token', response.access_token);
      
      // Check password status after login
      const hasPassword = await checkPasswordStatus();
      const userData = { ...response.user, hasPassword };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      console.log('✅ User logged in:', response.user.email);
      console.log('🔑 Password status:', hasPassword ? 'Set' : 'Not set');
      
      // Redirect based on password status
      if (!hasPassword) {
        router.push('/set-password');
      } else {
        router.push('/dashboard');
      }
      
      return userData;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const googleLogin = async (credential: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Google login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      
      // Check if user has password
      const hasPassword = await checkPasswordStatus();
      const userData = { ...data.user, hasPassword };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      console.log('✅ Google login successful:', data.user.email);
      console.log('🔑 Password status:', hasPassword ? 'Set' : 'Not set');
      
      // Redirect to password setup for new users or users without password
      if (!hasPassword) {
        console.log('⚠️ Password not set, redirecting to setup page');
        router.push('/set-password');
      } else {
        router.push('/dashboard');
      }
      
      return userData;
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      throw error;
    }
  };

  const logout = () => {
    const userEmail = user?.email || 'user';
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('👋 User logged out:', userEmail);
    
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      googleLogin,
      logout, 
      isLoading, 
      setUser,
      checkPasswordStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}