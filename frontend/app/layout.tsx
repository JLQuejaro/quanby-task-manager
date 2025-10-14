'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { AuthNotificationWrapper } from '@/contexts/AuthNotificationWrapper';

const inter = Inter({ subsets: ['latin'] });

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <AuthNotificationWrapper>
            {children}
          </AuthNotificationWrapper>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

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
          <Providers>
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
          </Providers>
        </QueryClientProvider>
      </body>
    </html>
  );
}