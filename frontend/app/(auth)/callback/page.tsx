'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckSquare } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      router.push(`/login?error=${error}`);
      return;
    }

    if (token) {
      try {
        // Decode JWT token to get user info
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        
        const payload = JSON.parse(jsonPayload);
        
        // Create user object from JWT payload
        const user = {
          id: payload.sub,
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
        };

        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('Auth successful, redirecting to dashboard...');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } catch (error) {
        console.error('Error processing authentication:', error);
        router.push('/login?error=auth_failed');
      }
    } else {
      console.error('No token found');
      router.push('/login?error=no_token');
    }
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

        {/* Loading Spinner */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent mx-auto"></div>
        <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          Completing sign in...
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Please wait while we redirect you
        </p>
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