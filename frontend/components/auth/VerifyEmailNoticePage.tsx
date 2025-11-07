'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

export function VerifyEmailNoticePage() {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ force: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }

      setResendSuccess(true);
      addNotification(
        'verification_resent',
        'Email Sent',
        'Verification email has been sent. Please check your inbox.',
        undefined,
        { action: 'resend_verification' }
      );

    } catch (error: any) {
      console.error('Resend verification error:', error);
      addNotification(
        'resend_failed',
        'Failed to Send',
        error.message || 'Failed to resend verification email',
        undefined,
        { action: 'resend_verification_failed' }
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Verify Your Email
          </h2>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've sent a verification email to <strong className="text-gray-900 dark:text-white">{user?.email}</strong>.
            Please check your inbox and click the verification link to activate your account.
          </p>

          {/* Success Message */}
          {resendSuccess && (
            <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-600 dark:text-green-400">Email sent successfully!</span>
            </div>
          )}

          {/* Resend Button */}
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full h-11 bg-[#4169E1] hover:bg-[#3558CC] text-white font-medium rounded-xl mb-4"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend Verification Email'
            )}
          </Button>

          {/* Help Text */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Didn't receive the email? Check your spam folder or click the button above to resend.
          </p>
        </div>
      </div>
    </div>
  );
}