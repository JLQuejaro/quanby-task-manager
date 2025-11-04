'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';
import { User } from '@/lib/types';
import { useNotifications } from '@/contexts/NotificationContext';

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }, rememberMe?: boolean) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  checkPasswordStatus: () => Promise<boolean>;
  rememberMe: boolean;
  setRememberMe: (remember: boolean) => void;
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
  const [rememberMe, setRememberMeState] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { addNotification } = useNotifications();

  // Check if user has set a password
  const checkPasswordStatus = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`${API_URL}/auth/has-password`, {
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
      const rememberMePref = localStorage.getItem('remember_me') === 'true';

      setRememberMeState(rememberMePref);

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Check password status
          const hasPassword = await checkPasswordStatus();
          
          const userData = { ...parsedUser, hasPassword };
          setUser(userData);
          console.log('✅ User loaded from localStorage:', parsedUser.email);
          console.log('🔑 Password status:', hasPassword ? 'Set' : 'Not set');
          console.log('💾 Remember Me:', rememberMePref ? 'Enabled' : 'Disabled');
          console.log('📧 Email verified:', parsedUser.emailVerified);
          
          // Mark session as active
          if (rememberMePref) {
            sessionStorage.setItem('session_active', 'true');
          }
          
          // Check email verification status first
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

  // CRITICAL: Auto-logout when browser/tab closes
  useEffect(() => {
    // Handle browser/tab close
    const handleBeforeUnload = () => {
      if (!rememberMe) {
        console.log('🚪 Browser closing - Auto-logout enabled (Remember Me: OFF)');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('session_active');
      } else {
        console.log('💾 Browser closing - Session persisted (Remember Me: ON)');
      }
    };

    // Session-based logout (clears when all tabs close)
    const checkSession = () => {
      if (!rememberMe && user) {
        const sessionActive = sessionStorage.getItem('session_active');
        
        if (!sessionActive) {
          console.log('🚪 All tabs closed - Auto-logout triggered');
          performLogout();
        } else {
          // Mark this session as active
          sessionStorage.setItem('session_active', 'true');
        }
      }
    };

    // Register event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', checkSession);

    // Initial session check
    if (!rememberMe && user) {
      const sessionActive = sessionStorage.getItem('session_active');
      if (!sessionActive) {
        sessionStorage.setItem('session_active', 'true');
      }
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', checkSession);
    };
  }, [user, rememberMe]);

  // OPTIONAL: Inactivity timeout (30 minutes)
  useEffect(() => {
    if (!user || rememberMe) return;

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('⏰ Inactivity timeout (30 min) - Auto-logout triggered');
        addNotification(
          'auth_status',
          'Session Expired',
          'You have been logged out due to inactivity.',
          undefined,
          { action: 'auto_logout_inactivity' }
        );
        performLogout();
      }, INACTIVITY_TIMEOUT);
    };

    // Events that reset the inactivity timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    // Initial timeout
    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [user, rememberMe]);

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

  const performLogout = () => {
    console.log('🔓 Performing logout...');
    
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('session_active');
    
    // Clear user state
    setUser(null);
    
    // Redirect to login
    router.push('/login');
  };

  const login = async (credentials: { email: string; password: string }, rememberMeOption = false) => {
    try {
      const { email, password } = credentials;
      
      const response = await authApi.login(email, password);
      localStorage.setItem('token', response.access_token);
      
      // Set remember me preference
      setRememberMeState(rememberMeOption);
      localStorage.setItem('remember_me', rememberMeOption.toString());
      
      // Mark session as active
      sessionStorage.setItem('session_active', 'true');
      
      // Check password status after login
      const hasPassword = await checkPasswordStatus();
      const userData = { ...response.user, hasPassword };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      console.log('✅ User logged in:', response.user.email);
      console.log('🔑 Password status:', hasPassword ? 'Set' : 'Not set');
      console.log('💾 Remember Me:', rememberMeOption ? 'Enabled' : 'Disabled');
      console.log('📧 Email verified:', response.user.emailVerified);
      
      // FIXED: Only show notification for successful login
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
      
      // FIXED: Only show notification for failed login
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

  // FIXED: Removed logout notification
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('session_active');
    setUser(null);
    console.log('👋 User logged out');
    
    router.push('/login');
  };

  const setRememberMe = (remember: boolean) => {
    console.log('💾 Remember Me preference changed:', remember ? 'Enabled' : 'Disabled');
    setRememberMeState(remember);
    localStorage.setItem('remember_me', remember.toString());
    
    if (remember && user) {
      sessionStorage.setItem('session_active', 'true');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      setUser,
      checkPasswordStatus,
      rememberMe,
      setRememberMe
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