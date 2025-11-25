import { LogOut, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DangerZoneSectionProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export function DangerZoneSection({ onLogout, onDeleteAccount }: DangerZoneSectionProps) {
  return (
    <Card className="rounded-2xl bg-white dark:bg-gray-900 border-2 border-red-200 dark:border-red-900">
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
          Danger Zone
        </h2>
        <div className="space-y-4">
          {/* Logout */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Log Out</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sign out of your account
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={onLogout}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
              >
                Log Out
              </Button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400">
                    Delete Account
                  </h4>
                  <p className="text-sm text-red-600/80 dark:text-red-400/80">
                    Permanently delete your account and all data
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={onDeleteAccount}
                className="bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}