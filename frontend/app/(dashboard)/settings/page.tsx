'use client';

import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, User, Bell, Palette } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const settingsOptions = [
    {
      icon: Lock,
      title: 'Set Password',
      description: 'Set a password to enable email/password login',
      action: () => router.push('/settings/password'),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: User,
      title: 'Profile Settings',
      description: 'Update your personal information',
      action: () => router.push('/profile'),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage your notification preferences',
      action: () => router.push('/notifications'),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize theme and display settings',
      action: () => {},
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <Header title="Settings" showSearch={false} />
      
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-4">
          {settingsOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <Card 
                key={index}
                className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800 hover:shadow-md transition-all cursor-pointer"
                onClick={option.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl ${option.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${option.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                    <svg 
                      className="h-5 w-5 text-gray-400" 
                      fill="none" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}