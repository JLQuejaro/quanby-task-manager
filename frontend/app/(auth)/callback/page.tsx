'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckSquare } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          setStatus('error');
          setErrorMessage(decodeURIComponent(error));
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        if (!token) {
          console.error('No token found');
          setStatus('error');
          setErrorMessage('No authentication token received');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Store token
        localStorage.setItem('token', token);
        localStorage.setItem('access_token', token);

        // Fetch user profile from backend
        const response = await fetch('http://localhost:3001/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const userData = await response.json();
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('Google OAuth successful:', userData);
        setStatus('success');
        
        // Small delay to show success state
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } catch (error) {
        console.error('Error processing authentication:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4169E1]">
            <CheckSquare className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quanby</h1>
          </div>
        </div>

        {status === 'loading' && (
          <>
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent mx-auto"></div>
            <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
              Completing sign in...
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              Please wait while we authenticate your account
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mt-6 text-sm font-medium text-gray-900 dark:text-white">
              Success!
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-900">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="mt-6 text-sm font-medium text-red-600 dark:text-red-400">
              Authentication Failed
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              {errorMessage}
            </p>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
              Redirecting to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}