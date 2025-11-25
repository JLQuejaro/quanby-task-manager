'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailNoticePage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const urlMessage = searchParams.get('message');
    const urlEmail = searchParams.get('email');

    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
    } else {
      setMessage('Please check your email to verify your account');
    }

    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          {/* Email Icon */}
          <div className="mx-auto h-16 w-16 text-blue-600 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Check Your Email
          </h2>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {message}
          </p>

          {/* Email Display */}
          {email && (
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-6">
              {email}
            </p>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>Next steps:</strong>
            </p>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Open your email inbox</li>
              <li>Look for our verification email</li>
              <li>Click the verification link</li>
              <li>You'll be automatically logged in</li>
            </ol>
          </div>

          {/* Troubleshooting */}
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <p>Didn't receive the email?</p>
            <ul className="space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes and refresh your inbox</li>
            </ul>
          </div>

          {/* Back to Login */}
          <div className="mt-8">
            <Link 
              href="/login"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}