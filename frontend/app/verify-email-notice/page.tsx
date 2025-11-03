'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckSquare, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function VerifyEmailNoticePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // FIXED: Changed isEmailVerified to emailVerified
    if (user?.emailVerified) {
      console.log('✅ Email already verified, redirecting to set-password or dashboard');
      router.push('/set-password');
    }

    // If no user is logged in, redirect to login
    if (!user) {
      console.log('⚠️ No user found, redirecting to login');
      router.push('/login');
    }
  }, [user, router]);

  const handleResendVerification = async () => {
    if (cooldown > 0 || isResending) {
      console.log('⏱️ Cooldown active or already sending');
      return;
    }

    setIsResending(true);
    setResendMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');

      if (!token) {
        setResendMessage('❌ Please login to resend verification email.');
        setIsResending(false);
        return;
      }

      console.log('📤 Resending verification email...');

      const response = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Verification email sent successfully');
        setResendMessage('✅ Verification email sent! Check your inbox.');
        
        // Start 2-minute cooldown
        setCooldown(120);
        const interval = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        const data = await response.json();
        console.warn('⚠️ Resend throttled:', data.message);
        setResendMessage(`⚠️ ${data.message || 'Failed to resend email.'}`);
      }
    } catch (error) {
      console.error('❌ Resend verification error:', error);
      setResendMessage('❌ Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = () => {
    console.log('👋 Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if no user (waiting for redirect)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      {/* Theme Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 rounded-xl"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

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

        {/* Verification Notice Card */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center space-y-4">
            {/* Mail Icon */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Mail className="h-8 w-8 text-[#4169E1]" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verify Your Email
            </h2>

            {/* Description */}
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-400">
                We've sent a verification email to
              </p>
              <p className="font-medium text-gray-900 dark:text-white break-all">
                {user?.email}
              </p>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-500">
              Please check your inbox and click the verification link to activate your account.
            </p>

            {/* Resend Message */}
            {resendMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                resendMessage.includes('✅') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                <p>{resendMessage}</p>
              </div>
            )}

            {/* Resend Button with Cooldown */}
            <Button
              onClick={handleResendVerification}
              disabled={isResending || cooldown > 0}
              className="w-full h-11 bg-[#4169E1] hover:bg-[#3558CC] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : cooldown > 0 ? (
                `Resend in ${formatCooldown(cooldown)}`
              ) : (
                'Resend Verification Email'
              )}
            </Button>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full h-11 font-medium rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="space-y-2">
          <p className="text-center text-xs text-gray-500 dark:text-gray-500">
            Didn't receive the email? Check your spam folder or click resend above.
          </p>
          <p className="text-center text-xs text-gray-500 dark:text-gray-500">
            After verifying your email, you'll be redirected to set up your password.
          </p>
        </div>
      </div>
    </div>
  );
}