'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, CheckSquare, AlertCircle, Check, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';

interface PasswordValidation {
  isValid: boolean;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    noSpaces: boolean;
  };
}

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    isValid: false,
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecial: false,
      noSpaces: false,
    },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid reset link. Please request a new one.');
    }
  }, []);

  const validatePassword = (pwd: string): PasswordValidation => {
    const requirements = {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*]/.test(pwd),
      noSpaces: !/\s/.test(pwd),
    };

    const isValid = Object.values(requirements).every(Boolean);

    return { isValid, requirements };
  };

  useEffect(() => {
    if (newPassword) {
      setPasswordValidation(validatePassword(newPassword));
    } else {
      setPasswordValidation({
        isValid: false,
        requirements: {
          minLength: false,
          hasUppercase: false,
          hasLowercase: false,
          hasNumber: false,
          hasSpecial: false,
          noSpaces: false,
        },
      });
    }
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Please meet all password requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Failed to reset password. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Password Reset Successful!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your password has been updated successfully.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4169E1]">
            <CheckSquare className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quanby</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Task Manager</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
              <Lock className="w-8 h-8 text-[#4169E1]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your new password below
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-900 dark:text-white">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl"
                  placeholder="Enter new password"
                  disabled={isLoading || !token}
                  required
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  type="button"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900 dark:text-white">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl"
                  placeholder="Confirm new password"
                  disabled={isLoading || !token}
                  required
                />
                <button
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  type="button"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className="mt-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 space-y-2">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Password Requirements:
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {passwordValidation.requirements.minLength ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordValidation.requirements.minLength
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Minimum of 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.requirements.hasUppercase ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordValidation.requirements.hasUppercase
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      At least one uppercase letter (A–Z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.requirements.hasLowercase ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordValidation.requirements.hasLowercase
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      At least one lowercase letter (a–z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.requirements.hasNumber ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordValidation.requirements.hasNumber
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      At least one number (0–9)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.requirements.hasSpecial ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordValidation.requirements.hasSpecial
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      At least one special symbol (! @ # $ % ^ & *)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.requirements.noSpaces ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordValidation.requirements.noSpaces
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      No spaces allowed
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !token}
              className="w-full h-11 bg-[#4169E1] hover:bg-[#3558CC] text-white font-medium rounded-xl"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-[#4169E1] hover:underline font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-[#4169E1] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}