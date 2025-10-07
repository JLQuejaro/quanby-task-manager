'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userData = searchParams.get('user');

    if (token && userData) {
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', userData);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } else if (user) {
      // Already logged in
      router.push('/dashboard');
    } else {
      // No token, redirect to login
      router.push('/login');
    }
  }, [searchParams, router, user]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}