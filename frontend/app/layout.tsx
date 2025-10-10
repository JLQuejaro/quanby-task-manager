'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <NotificationProvider>
              <AuthProvider>
                {children}
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    className: 'dark:bg-gray-800 dark:text-gray-100',
                    style: {
                      borderRadius: '12px',
                      padding: '16px',
                    },
                  }}
                />
              </AuthProvider>
            </NotificationProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}