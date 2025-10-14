'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useNotifications } from '@/contexts/NotificationContext';

export default function SetPasswordPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  
  const [hasPassword, setHasPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(true);

  // ✅ Get API URL from environment variable or use default
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Check if user already has a password
  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/auth/has-password`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHasPassword(data.hasPassword);
        }
      } catch (err) {
        console.error('Failed to check password status:', err);
      } finally {
        setIsCheckingPassword(false);
      }
    };

    checkPasswordStatus();
  }, [API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    // Validation
    if (password !== confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (hasPassword && !oldPassword) {
      setError('Please enter your current password');
      setIsLoading(false);
      return;
    }

    if (hasPassword && oldPassword === password) {
      setError('New password must be different from current password');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = hasPassword 
        ? `${API_URL}/api/auth/change-password`
        : `${API_URL}/api/auth/set-password`;

      const body = hasPassword 
        ? { oldPassword, newPassword: password }
        : { password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${hasPassword ? 'change' : 'set'} password`);
      }

      const successMessage = hasPassword 
        ? 'Password changed successfully! You can now login with your new password.'
        : 'Password set successfully! You can now login with your email and this password.';

      setMessage(successMessage);
      
      // ✅ Add notification
      addNotification(
        'auth_status',
        hasPassword ? 'Password Changed' : 'Password Set',
        successMessage,
        undefined,
        { action: hasPassword ? 'password_changed' : 'password_set' }
      );

      // Clear form
      setOldPassword('');
      setPassword('');
      setConfirmPassword('');
      
      // Update hasPassword state if it was a first-time set
      if (!hasPassword) {
        setHasPassword(true);
      }
      
      // Redirect to settings after 2 seconds
      setTimeout(() => {
        router.push('/settings');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${hasPassword ? 'change' : 'set'} password`;
      setError(errorMessage);
      
      // ✅ Add error notification
      addNotification(
        'auth_status',
        hasPassword ? 'Password Change Failed' : 'Password Set Failed',
        errorMessage,
        undefined,
        { action: 'password_error' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingPassword) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        <Header title="Password Settings" showSearch={false} />
        <div className="p-6 max-w-2xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <Header title={hasPassword ? "Change Password" : "Set Password"} showSearch={false} />
      
      <div className="p-6 max-w-2xl mx-auto">
        <Link 
          href="/settings" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold dark:text-white">
              {hasPassword ? 'Change Account Password' : 'Set Account Password'}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {hasPassword 
                ? 'Update your password to keep your account secure. You\'ll need to enter your current password first.'
                : 'Set a password to enable email/password login for your account. After setting a password, you can login using either Google or your email and password.'
              }
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Old Password Field - Only shown if user already has a password */}
              {hasPassword && (
                <div>
                  <Label htmlFor="oldPassword" className="text-sm font-medium dark:text-gray-300">
                    Current Password
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="oldPassword"
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="password" className="text-sm font-medium dark:text-gray-300">
                  {hasPassword ? 'New Password' : 'Password'}
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={hasPassword ? "Enter new password" : "Enter password"}
                    className="pr-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium dark:text-gray-300">
                  Confirm {hasPassword ? 'New ' : ''}Password
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={hasPassword ? "Confirm new password" : "Confirm password"}
                    className="pr-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {message && (
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[#4169E1] hover:bg-[#3558CC] rounded-xl"
                disabled={isLoading}
              >
                {isLoading 
                  ? (hasPassword ? 'Changing Password...' : 'Setting Password...') 
                  : (hasPassword ? 'Change Password' : 'Set Password')
                }
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> {hasPassword 
                  ? 'After changing your password, you\'ll need to use the new password for future logins.'
                  : 'After setting a password, you\'ll be able to login using:'
                }
              </p>
              {!hasPassword && (
                <ul className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Your email and this password</li>
                  <li>• Google Sign-In (as before)</li>
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}