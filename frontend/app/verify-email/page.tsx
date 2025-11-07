'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckSquare, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { VerifyEmailNoticePage } from '@/components/auth/VerifyEmailNoticePage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useAuth();
  const { addNotification } = useNotifications();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'already_verified'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // CRITICAL FIX: Prevent multiple simultaneous verification attempts
  const verificationAttemptedRef = useRef(false);
  const isVerifyingRef = useRef(false);
  const token = searchParams.get('token');

  useEffect(() => {
    // CRITICAL FIX: Only run verification once
    if (verificationAttemptedRef.current) {
      console.log('⚠️ Verification already attempted, skipping duplicate call');
      return;
    }

    const verifyEmail = async () => {
      // CRITICAL FIX: Prevent concurrent requests
      if (isVerifyingRef.current) {
        console.log('⚠️ Verification already in progress, skipping');
        return;
      }

      try {
        isVerifyingRef.current = true;
        verificationAttemptedRef.current = true;

        // Check if user is already logged in and verified
        if (user?.emailVerified) {
          console.log('✅ User already verified, redirecting to dashboard');
          setStatus('already_verified');
          setUserEmail(user.email);
          
          addNotification(
            'auth_status',
            'Already Verified',
            'Your email is already verified. Redirecting to dashboard...',
            undefined,
            { action: 'already_verified', email: user.email }
          );
          
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          return;
        }

        const token = searchParams.get('token');

        if (!token) {
          return;
        }

        console.log('🔍 Verifying email with token:', token.substring(0, 20) + '...');
        console.log('🌐 API URL:', `${API_URL}/auth/verify-email?token=${token.substring(0, 20)}...`);

        const provider = searchParams.get('provider');

        let response: Response;
        if (provider === 'google') {
          // Google verification uses POST
          response = await fetch(`${API_URL}/auth/google/verify-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });
        } else {
          // Email/password verification uses GET
          response = await fetch(`${API_URL}/auth/verify-email?token=${token}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }

        console.log('📡 Response status:', response.status);

        // Try to parse response as JSON
        let data;
        try {
          data = await response.json();
          console.log('📦 Response data:', data);
        } catch (parseError) {
          console.error('❌ Failed to parse response:', parseError);
          throw new Error('Server returned invalid response. Please try again later.');
        }

        if (!response.ok) {
          console.error('❌ Verification failed:', data);
          const errorMsg = data.message || data.error || `Verification failed (Status: ${response.status})`;
          
          // Special handling for "already used" tokens
          if (errorMsg.includes('already used') || errorMsg.includes('Invalid or expired')) {
            setErrorMessage('This verification link has already been used or has expired. Please login to request a new one.');
          } else {
            setErrorMessage(errorMsg);
          }
          
          throw new Error(errorMsg);
        }

        console.log('✅ Email verified successfully!');
        console.log('👤 User data:', data.user);
        console.log('🔑 Access token received:', !!data.access_token);

        // Validate response has required data
        if (!data.access_token || !data.user) {
          throw new Error('Invalid server response: missing authentication data');
        }

        // Store authentication data
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Update auth context
        setUser(data.user);

        // Set user email for display
        setUserEmail(data.user.email || '');

        // Show success notification
        addNotification(
          'auth_status',
          'Email Verified! 🎉',
          `Welcome ${data.user.name || data.user.email}! Redirecting to dashboard...`,
          undefined,
          { action: 'email_verified', email: data.user.email }
        );

        setStatus('success');

        // Auto-redirect to dashboard after 2 seconds
        console.log('🚀 Redirecting to dashboard in 2 seconds...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('❌ Email verification error:', error);
        
        let errorMsg = 'Failed to verify email. The link may be expired or invalid.';
        
        if (error instanceof Error) {
          errorMsg = error.message;
        } else if (typeof error === 'string') {
          errorMsg = error;
        }

        setStatus('error');
        if (!errorMessage) {
          setErrorMessage(errorMsg);
        }

        // Show error notification
        addNotification(
          'auth_status',
          'Verification Failed',
          errorMsg,
          undefined,
          { action: 'email_verification_failed' }
        );
      } finally {
        isVerifyingRef.current = false;
      }
    };

    verifyEmail();
  }, [searchParams, router, setUser, addNotification, user, errorMessage]);

  if (!token) {
    return <VerifyEmailNoticePage />;
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

        {/* Status Card */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center space-y-6">
            {/* Verifying State */}
            {status === 'verifying' && (
              <>
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Loader2 className="h-8 w-8 text-[#4169E1] animate-spin" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Verifying Your Email
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please wait while we verify your email address...
                  </p>
                </div>
              </>
            )}

            {/* Already Verified State */}
            {status === 'already_verified' && (
              <>
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Already Verified! ✅
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Your email is already verified.
                  </p>
                  {userEmail && (
                    <p className="text-sm font-medium text-[#4169E1] mb-4">
                      {userEmail}
                    </p>
                  )}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Redirecting to dashboard...
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Success State */}
            {status === 'success' && (
              <>
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 animate-bounce">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Email Verified! 🎉
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Your email has been successfully verified.
                  </p>
                  {userEmail && (
                    <p className="text-sm font-medium text-[#4169E1] mb-4">
                      {userEmail}
                    </p>
                  )}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <Loader2 className="h-4 w-4 text-green-600 dark:text-green-400 animate-spin" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Logging you in and redirecting to dashboard...
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Error State */}
            {status === 'error' && (
              <>
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Verification Failed
                  </h2>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4 whitespace-pre-line">
                    {errorMessage}
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/login')}
                      className="w-full h-11 bg-[#4169E1] hover:bg-[#3558CC] text-white font-medium rounded-xl transition"
                    >
                      Go to Login
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Login and request a new verification email from your account settings.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Help Text */}
        {(status === 'success' || status === 'already_verified') && (
          <p className="text-center text-xs text-gray-500 dark:text-gray-500">
            You will be automatically redirected in a few seconds.
          </p>
        )}
        
        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && status === 'error' && (
          <div className="text-center text-xs text-gray-400 dark:text-gray-600">
            <p>API URL: {API_URL}</p>
            <p>Check browser console for more details</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading verification...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}