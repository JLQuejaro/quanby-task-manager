'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckSquare,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SetPasswordPage() {
  const router = useRouter();
  const { user, checkPasswordStatus } = useAuth();
  const { addNotification } = useNotifications();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // If user doesn't exist, redirect to login
        if (!user?.email) {
          router.push('/login');
          return;
        }

        // If user already has password, redirect to dashboard
        const hasPassword = await checkPasswordStatus();
        if (hasPassword) {
          console.log('User already has password, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking password status:', error);
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [user, checkPasswordStatus, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validation
    if (!newPassword) {
      setError('Please enter a password');
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to set password');
      }

      addNotification(
        'auth_status',
        'Password Set Successfully!',
        'You can now use your email and password to log in.',
        undefined,
        { action: 'password_set' }
      );

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to set password. Please try again.';
      setError(errorMessage);

      addNotification(
        'auth_status',
        'Password Setup Failed',
        errorMessage,
        undefined,
        { action: 'password_set_error' }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4169E1]">
            <CheckSquare className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quanby</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Task Manager</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Set Your Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.authProvider === 'google' 
              ? 'You signed in with Google. Set a password to enable email/password login as well.'
              : 'Complete your account setup by setting a password.'}
          </p>
        </div>

        {/* Form Card */}
        <Card className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Info Message */}
          {user?.authProvider === 'google' && (
            <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Google Account Setup
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    This step is required to enable email/password login as an alternative to Google Sign-In.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Password
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password (min. 6 characters)"
                  className="pl-10 pr-10 h-11 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 rounded-xl border-2 focus:border-[#4169E1] dark:focus:border-[#4169E1]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Confirm Password
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="pl-10 pr-10 h-11 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 rounded-xl border-2 focus:border-[#4169E1] dark:focus:border-[#4169E1]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-[#4169E1] hover:bg-[#3558CC] text-white font-medium rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Setting Password...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Set Password
                </span>
              )}
            </Button>
          </form>
        </Card>

        {/* Info Text */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            This password will be used for email/password login.
            {user?.authProvider === 'google' && ' You can still use Google Sign-In anytime.'}
          </p>
        </div>
      </div>
    </div>
  );
}