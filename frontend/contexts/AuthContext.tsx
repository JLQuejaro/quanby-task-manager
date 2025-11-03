'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';
import { User } from '@/lib/types';
import { useNotifications } from '@/contexts/NotificationContext';

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  checkPasswordStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/callback',
  '/set-password',
  '/verify-email',
  '/verify-email-notice'
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { addNotification } = useNotifications();

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
          
          const userData = { ...parsedUser, hasPassword };
          setUser(userData);
          console.log('✅ User loaded from localStorage:', parsedUser.email);
          console.log('🔑 Password status:', hasPassword ? 'Set' : 'Not set');
          console.log('📧 Email verified:', parsedUser.emailVerified);
          
          // CRITICAL FIX: Check email verification status first
          const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
          
          if (!parsedUser.emailVerified && !isPublicPath && pathname !== '/verify-email-notice') {
            console.log('⚠️ Email not verified, redirecting to notice page');
            router.push('/verify-email-notice');
            setIsLoading(false);
            return;
          }
          
          // Then redirect to password setup if needed
          if (parsedUser.emailVerified && !hasPassword && !isPublicPath && pathname !== '/set-password') {
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
      const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
      
      if (!isPublicPath) {
        console.log('⚠️ No user found, redirecting to login');
        router.push('/login');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      // FIXED: Destructure email and password from credentials object
      const { email, password } = credentials;
      
      // FIXED: Pass email and password as separate arguments
      const response = await authApi.login(email, password);
      localStorage.setItem('token', response.access_token);
      
      // Check password status after login
      const hasPassword = await checkPasswordStatus();
      const userData = { ...response.user, hasPassword };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      console.log('✅ User logged in:', response.user.email);
      console.log('🔑 Password status:', hasPassword ? 'Set' : 'Not set');
      console.log('📧 Email verified:', response.user.emailVerified);
      
      addNotification(
        'auth_status',
        'Welcome Back!',
        `Successfully logged in as ${response.user.email}`,
        undefined,
        { action: 'login', email: response.user.email }
      );
      
      // Redirect based on verification and password status
      if (!response.user.emailVerified) {
        router.push('/verify-email-notice');
      } else if (!hasPassword) {
        router.push('/set-password');
      } else {
        router.push('/dashboard');
      }
      
      return userData;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      addNotification(
        'auth_status',
        'Login Failed',
        error.response?.data?.message || error.message || 'Failed to log in. Please check your credentials.',
        undefined,
        { action: 'login_failed', email: credentials.email }
      );
      
      throw error;
    }
  };

  const logout = () => {
    const userEmail = user?.email || 'user';
    const userName = user?.name || 'there';
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('👋 User logged out');
    
    addNotification(
      'auth_status',
      'Logged Out',
      `See you later, ${userName}! You've been successfully logged out.`,
      undefined,
      { action: 'logout', email: userEmail }
    );
    
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
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