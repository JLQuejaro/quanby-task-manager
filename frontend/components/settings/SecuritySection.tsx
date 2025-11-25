import { useState } from 'react';
import { Shield, Key } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PasswordForm } from './PasswordForm';

interface SecuritySectionProps {
  hasPassword: boolean;
  isGoogleUser: boolean;
  onPasswordSubmit: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
}

export function SecuritySection({ hasPassword, isGoogleUser, onPasswordSubmit }: SecuritySectionProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  return (
    <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#4169E1]" />
          Security
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Password Management
            </h3>
          </div>

          {/* Change Password Button */}
          <button
            type="button"
            onClick={() => setShowPasswordForm(true)}
            className="w-full p-4 rounded-xl border-2 border-purple-500 bg-purple-500/5 dark:bg-purple-500/10 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600 text-white">
                <Key className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Update your password
                </p>
              </div>
            </div>
          </button>

          {/* Password Form */}
          {showPasswordForm && (
            <PasswordForm
              hasPassword={hasPassword}
              onSubmit={onPasswordSubmit}
              onCancel={() => setShowPasswordForm(false)}
            />
          )}
        </div>
      </div>
    </Card>
  );
}