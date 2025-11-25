import { useState } from 'react';
import { Shield, Key, Info } from 'lucide-react';
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
            {hasPassword ? (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                Active
              </span>
            ) : (
              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full">
                Not Set
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => !hasPassword && setShowPasswordForm(true)}
              disabled={hasPassword}
              className={`p-4 rounded-xl border-2 transition-all ${
                !hasPassword
                  ? 'border-[#4169E1] bg-[#4169E1]/5 dark:bg-[#4169E1]/10 hover:bg-[#4169E1]/10 dark:hover:bg-[#4169E1]/20 cursor-pointer'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  !hasPassword
                    ? 'bg-[#4169E1] text-white'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                }`}>
                  <Key className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h4 className={`font-semibold ${
                    !hasPassword
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-600'
                  }`}>
                    Set Password
                  </h4>
                  <p className={`text-xs ${
                    !hasPassword
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    Create new password
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => hasPassword && setShowPasswordForm(true)}
              disabled={!hasPassword}
              className={`p-4 rounded-xl border-2 transition-all ${
                hasPassword
                  ? 'border-purple-500 bg-purple-500/5 dark:bg-purple-500/10 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 cursor-pointer'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  hasPassword
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                }`}>
                  <Key className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h4 className={`font-semibold ${
                    hasPassword
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-600'
                  }`}>
                    Change Password
                  </h4>
                  <p className={`text-xs ${
                    hasPassword
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    Update existing password
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Info message for Google users */}
          {isGoogleUser && !hasPassword && !showPasswordForm && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Google Account - Password Optional
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    You signed in with Google. Set a password to enable email/password login as an alternative.
                  </p>
                </div>
              </div>
            </div>
          )}

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

