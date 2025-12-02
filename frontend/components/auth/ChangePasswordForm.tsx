'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { addNotification } = useNotifications();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('One number');
    }
    
    return errors;
  };

  const passwordErrors = newPassword ? validatePassword(newPassword) : [];
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    if (passwordErrors.length > 0) {
      setError('Password does not meet requirements');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${apiUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newPasswordConfirm: confirmPassword,
        }),
      });

      const data = await response.json();

      // Handle 401 (Unauthorized) - Trigger logout (e.g. Account Locked or Session Expired)
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?error=' + encodeURIComponent(data.message || 'Session expired');
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      addNotification(
        'password_changed',
        'Password Changed',
        'Your password has been changed successfully. All other sessions have been logged out.',
        undefined,
        { action: 'password_change' }
      );

    } catch (error: any) {
      console.error('Change password error:', error);
      
      // Display the error message from the backend directly
      // This ensures users see "X attempts remaining" or "Account locked" messages
      setError(error.message || 'Failed to change password');

      addNotification(
        'password_change_failed',
        'Password Change Failed',
        error.message || 'Failed to change password',
        undefined,
        { action: 'password_change_failed' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Change Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-900/20 p-3 border border-green-200 dark:border-green-800">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Password changed successfully!
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-900 dark:text-white">
              Current Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-10 pr-10 h-11 rounded-xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-gray-900 dark:text-white">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 pr-10 h-11 rounded-xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {newPassword && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Password must contain:</p>
                {[
                  { text: 'At least 8 characters', valid: newPassword.length >= 8 },
                  { text: 'One uppercase letter', valid: /[A-Z]/.test(newPassword) },
                  { text: 'One lowercase letter', valid: /[a-z]/.test(newPassword) },
                  { text: 'One number', valid: /[0-9]/.test(newPassword) },
                ].map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {req.valid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={`text-xs ${req.valid ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900 dark:text-white">
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10 h-11 rounded-xl"
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

            {confirmPassword && (
              <div className="flex items-center gap-2 mt-2">
                {passwordsMatch ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600 dark:text-green-400">Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-red-600 dark:text-red-400">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-[#4169E1] hover:bg-[#3558CC] text-white font-medium rounded-xl"
            disabled={isLoading || passwordErrors.length > 0 || !passwordsMatch}
          >
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </Button>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              🔒 <strong>Security Note:</strong> Changing your password will log you out of all other devices.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}