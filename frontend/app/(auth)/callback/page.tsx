'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Debug: Log all search params
        const allParams = new URLSearchParams(searchParams.toString());
        console.log('🔍 All callback params:', Object.fromEntries(allParams));

        const token = searchParams.get('token');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const errorUri = searchParams.get('error_uri');

        console.log('📋 Parsed params:', { token, error, errorDescription, errorUri });

        // Handle OAuth errors from backend
        if (error) {
          let errorMsg = error;
          if (errorDescription) {
            errorMsg = decodeURIComponent(errorDescription);
          } else {
            errorMsg = decodeURIComponent(error);
          }
          console.error('❌ OAuth error:', errorMsg);
          console.error('📌 Error code:', error);
          setStatus('error');
          setErrorMessage(errorMsg);
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Validate token received
        if (!token) {
          console.error('❌ No token received from OAuth callback');
          setStatus('error');
          setErrorMessage('No authentication token received. Please try again.');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        console.log('📝 Token received, storing and fetching profile...');

        // Store token in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('access_token', token);

        // Fetch user profile from backend
        const profileResponse = await fetch(`${API_URL}/api/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!profileResponse.ok) {
          const errorText = await profileResponse.text();
          console.error('❌ Profile fetch failed:', profileResponse.status, errorText);
          throw new Error(`Failed to fetch user profile: ${profileResponse.status}`);
        }

        const userData = await profileResponse.json();

        // Validate user data
        if (!userData || !userData.id || !userData.email) {
          console.error('❌ Invalid user data received:', userData);
          throw new Error('Invalid user data received from server');
        }

        console.log('✅ User profile fetched:', userData.email);

        // Check if user has password set
        console.log('🔑 Checking password status...');
        const passwordCheckResponse = await fetch(`${API_URL}/api/auth/has-password`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        let hasPassword = false;
        if (passwordCheckResponse.ok) {
          const passwordData = await passwordCheckResponse.json();
          hasPassword = passwordData.hasPassword;
          console.log('🔑 Password status:', hasPassword ? 'Set' : 'Not set');
        } else {
          console.warn('⚠️ Failed to check password status, assuming not set');
          hasPassword = false;
        }

        // Add hasPassword to user data
        const userDataWithPassword = { ...userData, hasPassword };

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userDataWithPassword));

        // Update AuthContext
        setUser(userDataWithPassword);

        console.log('✅ Google OAuth successful:', userData.email);
        setStatus('success');

        // Navigate based on password status
        setTimeout(() => {
          if (!hasPassword) {
            console.log('⚠️ User has no password, redirecting to set-password');
            router.push('/set-password');
          } else {
            console.log('✅ User has password, redirecting to dashboard');
            router.push('/dashboard');
          }
        }, 1000);
      } catch (error) {
        console.error('❌ Error processing OAuth callback:', error);
        setStatus('error');
        const errorMsg = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
        setErrorMessage(errorMsg);
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, router, setUser]);

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
              Redirecting...
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
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500 max-w-sm">
              {errorMessage}
            </p>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
              Redirecting to login in 2 seconds...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent"></div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}