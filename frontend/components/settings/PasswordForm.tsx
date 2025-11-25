// components/settings/PasswordForm.tsx

import { useState } from 'react';
import { Eye, EyeOff, Key, Check, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordRequirements } from './PasswordRequirements';
import { validatePassword } from './passwordUtils';

interface PasswordFormProps {
  hasPassword: boolean;
  onSubmit: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  onCancel: () => void;
}

export function PasswordForm({ hasPassword, onSubmit, onCancel }: PasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmNewPassword && confirmNewPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      setError('Password is required');
      return;
    }

    if (!passwordValidation.allValid) {
      setError('Password does not meet all requirements');
      setShowPasswordRequirements(true);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (hasPassword && !currentPassword.trim()) {
      setError('Please enter your current password');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(currentPassword.trim(), newPassword.trim(), confirmNewPassword.trim());
      
      const successMessage = hasPassword
        ? 'Password changed successfully! 🎉'
        : 'Password set successfully! You can now login with email and password. 🎉';
      
      setSuccess(successMessage);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordRequirements(false);

      setTimeout(() => {
        onCancel();
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred while changing your password';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
      {/* Current Password - Only show if user has password */}
      {hasPassword && (
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Current Password
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="pr-10 h-11 dark:bg-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 rounded-xl border-2 focus:border-[#4169E1] dark:focus:border-[#4169E1]"
              required={hasPassword}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {hasPassword ? 'New Password' : 'Password'}
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={() => setShowPasswordRequirements(true)}
            placeholder={hasPassword ? 'Enter new password' : 'Create a strong password'}
            className="pr-10 h-11 dark:bg-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 rounded-xl border-2 focus:border-[#4169E1] dark:focus:border-[#4169E1]"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <PasswordRequirements 
          validation={passwordValidation} 
          show={showPasswordRequirements && newPassword.length > 0} 
        />
      </div>

      {/* Confirm New Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmNewPassword" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Confirm {hasPassword ? 'New ' : ''}Password
        </Label>
        <div className="relative">
          <Input
            id="confirmNewPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder={hasPassword ? 'Re-enter new password' : 'Re-enter password'}
            className="pr-10 h-11 dark:bg-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 rounded-xl border-2 focus:border-[#4169E1] dark:focus:border-[#4169E1]"
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
        {/* Password Match Indicator */}
        {confirmNewPassword.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            {passwordsMatch ? (
              <>
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-700 dark:text-green-400">
                  Passwords match
                </span>
              </>
            ) : (
              <>
                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-xs text-red-600 dark:text-red-400">
                  Passwords do not match
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-green-600 dark:text-green-400">{success}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 bg-[#4169E1] hover:bg-[#3558CC] rounded-xl text-base font-semibold shadow-sm hover:shadow-md transition-all"
          disabled={isSubmitting || !passwordValidation.allValid || !passwordsMatch}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              {hasPassword ? 'Changing...' : 'Setting...'}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {hasPassword ? 'Change Password' : 'Set Password'}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}