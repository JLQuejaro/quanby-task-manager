// components/settings/AccountSection.tsx

import { User, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AccountSectionProps {
  user: {
    name?: string;
    email?: string;
    authProvider?: string;
  } | null;
}

export function AccountSection({ user }: AccountSectionProps) {
  const isGoogleUser = user?.authProvider === 'google';

  return (
    <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-[#4169E1]" />
          Account
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gradient-to-br from-[#4169E1] to-[#3558CC] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {user?.name || 'User'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user?.email || 'user@example.com'}
                </p>
                {isGoogleUser && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                    Signed in with Google
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}