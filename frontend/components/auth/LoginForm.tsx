'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { GoogleSignInButton } from '@/components/auth/GoogleSignIn';
import { Mail, Lock, Eye, EyeOff, CheckSquare, Moon, Sun, AlertCircle, Info, XCircle, CheckCircle2, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface InlineNotification {
  type: 'error' | 'success' | 'info' | 'warning';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  countdown?: number;
}

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<InlineNotification | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [rememberMeChecked, setRememberMeChecked] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { addNotification } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  // Countdown timer for auto-redirect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Auto-redirect when countdown reaches 0
      const emailParam = searchParams.get('email') || email;
      router.push(`/register?email=${encodeURIComponent(emailParam)}&message=account_not_found`);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, router, searchParams, email]);

  // Check for error/message from URL params (e.g., from Google OAuth redirect)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    const emailParam = searchParams.get('email');

    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam);
      
      if (decodedError.includes('register first') || decodedError.includes('No account found')) {
        setNotification({
          type: 'warning',
          title: 'Account Not Found',
          message: "This account doesn't exist. Please register first.",
          action: {
            label: 'Register Now',
            onClick: () => router.push(`/register?email=${encodeURIComponent(emailParam || '')}`),
          },
        });
        
        // Start countdown for auto-redirect
        setCountdown(5);
        
        // Show toast notification
        addNotification(
          'auth_status',
          'Account Not Found',
          'Please register first to continue.',
          undefined,
          { action: 'google_no_account', email: emailParam || '' }
        );
      } else if (decodedError.includes('Google')) {
        setNotification({
          type: 'info',
          title: 'Google Sign-In Required',
          message: decodedError,
        });
      } else {
        setNotification({
          type: 'error',
          title: 'Authentication Failed',
          message: decodedError,
        });
      }
    } else if (messageParam) {
      const decodedMessage = decodeURIComponent(messageParam);
      setNotification({
        type: 'info',
        title: 'Information',
        message: decodedMessage,
      });
    }
  }, [searchParams, router, addNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null); // Clear previous notifications
    setCountdown(null); // Clear countdown
    setIsLoading(true);

    try {
      const user = await login({ email, password }, rememberMeChecked);

      // Show success notification (toast only, handled by AuthContext)
      // The inline notification will be cleared automatically
      
    } catch (error: any) {
      console.error('❌ Login error:', error);

      // Handle enforced verification flow
      if (typeof error?.message === 'string' && error.message.toLowerCase().includes('verification')) {
        setNotification({
          type: 'info',
          title: 'Verification Required',
          message: 'We have sent a verification email. Please verify your email to continue.',
        });
        // Redirect to verify notice
        router.push('/verify-email-notice');
        setIsLoading(false);
        return;
      }
      
      const errorResponse = error.response?.data;
      const statusCode = errorResponse?.statusCode || error.response?.status;
      
      // Handle 404 Not Found - User doesn't exist
      if (statusCode === 404 || errorResponse?.error === 'Not Found') {
        const errorMessage = errorResponse?.message || 'No account found with this email. Please register first.';
        
        setNotification({
          type: 'warning',
          title: 'Account Not Found',
          message: "This account doesn't exist. Please register first.",
          action: {
            label: 'Register Now',
            onClick: () => {
              setCountdown(null); // Cancel countdown
              router.push(`/register?email=${encodeURIComponent(email)}&message=account_not_found`);
            },
          },
        });

        // Start 5-second countdown
        setCountdown(5);

        addNotification(
          'auth_status',
          'Account Not Found',
          errorMessage,
          undefined,
          { action: 'login_not_found', email, redirectTo: 'register' }
        );
      }
      // Handle 401 Unauthorized - Wrong password
      else if (statusCode === 401 || errorResponse?.error === 'Unauthorized') {
        const errorMessage = errorResponse?.message || 'Incorrect password. Please try again.';
        
        setNotification({
          type: 'error',
          title: 'Login Failed',
          message: errorMessage,
          action: {
            label: 'Forgot Password?',
            onClick: () => router.push('/forgot-password'),
          },
        });
        
        addNotification(
          'auth_status',
          'Login Failed',
          errorMessage,
          undefined,
          { action: 'login_failed', email }
        );
      }
      // Handle 409 Conflict - Google account trying to use password
      else if (statusCode === 409 || errorResponse?.error === 'Conflict') {
        const errorMessage = errorResponse?.message || 'This account uses Google Sign-In. Please use the Google button instead.';
        
        setNotification({
          type: 'info',
          title: 'Use Google Sign-In',
          message: errorMessage,
        });
        
        addNotification(
          'auth_status',
          'Use Google Sign-In',
          errorMessage,
          undefined,
          { action: 'login_conflict', email }
        );
      }
      // Generic error
      else {
        const errorMessage = errorResponse?.message || error.message || 'Login failed. Please try again.';
        
        setNotification({
          type: 'error',
          title: 'Login Failed',
          message: errorMessage,
        });
        
        addNotification(
          'auth_status',
          'Login Failed',
          errorMessage,
          undefined,
          { action: 'login_failed', email }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationStyles = (type: InlineNotification['type']) => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />,
          title: 'text-red-900 dark:text-red-200',
          message: 'text-red-700 dark:text-red-300',
          button: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white',
          cancelButton: 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200',
        };
      case 'success':
        return {
          container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />,
          title: 'text-green-900 dark:text-green-200',
          message: 'text-green-700 dark:text-green-300',
          button: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white',
          cancelButton: 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200',
        };
      case 'warning':
        return {
          container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
          icon: <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />,
          title: 'text-amber-900 dark:text-amber-200',
          message: 'text-amber-700 dark:text-amber-300',
          button: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white',
          cancelButton: 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200',
        };
      case 'info':
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />,
          title: 'text-blue-900 dark:text-blue-200',
          message: 'text-blue-700 dark:text-blue-300',
          button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white',
          cancelButton: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200',
        };
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      {/* Theme Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 rounded-xl"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      <div className="w-full max-w-md space-y-8">
        {/* Logo - Horizontal Layout */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4169E1]">
            <CheckSquare className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quanby</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Task Manager</p>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-center text-gray-600 dark:text-gray-400">
          Organize your tasks efficiently.
        </p>

        {/* Login Form */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Enhanced Notification with Countdown */}
            {notification && (
              <div className={`flex flex-col gap-3 rounded-lg p-4 border ${getNotificationStyles(notification.type).container} animate-in fade-in slide-in-from-top-2 duration-300`}>
                <div className="flex items-start gap-3">
                  {getNotificationStyles(notification.type).icon}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold ${getNotificationStyles(notification.type).title}`}>
                      {notification.title}
                    </h3>
                    <p className={`text-sm mt-1 ${getNotificationStyles(notification.type).message}`}>
                      {notification.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotification(null);
                      setCountdown(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Countdown Timer and Actions */}
                {countdown !== null && (
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-current/10">
                    <p className={`text-xs font-medium ${getNotificationStyles(notification.type).message}`}>
                      Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCountdown(null);
                          setNotification(null);
                        }}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg ${getNotificationStyles(notification.type).cancelButton} transition-colors`}
                      >
                        Cancel
                      </button>
                      {notification.action && (
                        <button
                          type="button"
                          onClick={notification.action.onClick}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg ${getNotificationStyles(notification.type).button} transition-colors flex items-center gap-1`}
                        >
                          {notification.action.label}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button (without countdown) */}
                {countdown === null && notification.action && (
                  <button
                    type="button"
                    onClick={notification.action.onClick}
                    className={`text-sm font-medium px-4 py-2 rounded-lg ${getNotificationStyles(notification.type).button} transition-colors flex items-center justify-center gap-2 w-full`}
                  >
                    {notification.action.label}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-white">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-white">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="remember-me" 
                  checked={rememberMeChecked}
                  onCheckedChange={(checked) => setRememberMeChecked(checked as boolean)}
                  className="mt-0.5"
                  disabled={isLoading}
                />
                <div className="flex-1">
                  <label
                    htmlFor="remember-me"
                    className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer block"
                  >
                    Keep me signed in
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>
                      {rememberMeChecked 
                        ? 'You will stay logged in even after closing the browser' 
                        : 'You will be logged out when you close the browser'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-[#4169E1] hover:bg-[#3558CC] text-white font-medium rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#4169E1] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">or</span>
              </div>
            </div>

            {/* Google Sign-In Button (Component) */}
            <GoogleSignInButton />

          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-[#4169E1] hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
