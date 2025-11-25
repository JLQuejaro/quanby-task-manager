import { Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { NotificationPreferences } from './types';

interface NotificationsSectionProps {
  preferences: NotificationPreferences;
  onPreferenceChange: (key: keyof NotificationPreferences, value: boolean) => void;
}

export function NotificationsSection({ preferences, onPreferenceChange }: NotificationsSectionProps) {
  const notificationItems = [
    {
      key: 'emailNotifications' as keyof NotificationPreferences,
      title: 'Email Notifications',
      description: 'Receive notifications via email',
    },
    {
      key: 'pushNotifications' as keyof NotificationPreferences,
      title: 'Push Notifications',
      description: 'Show desktop notifications',
    },
    {
      key: 'taskReminders' as keyof NotificationPreferences,
      title: 'Task Reminders',
      description: 'Get reminded about upcoming tasks',
    },
    {
      key: 'deadlineAlerts' as keyof NotificationPreferences,
      title: 'Deadline Alerts',
      description: 'Alert me about approaching deadlines',
    },
  ];

  return (
    <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#4169E1]" />
          Notifications
        </h2>
        <div className="space-y-4">
          {notificationItems.map((item) => (
            <div key={item.key} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
                <Switch
                  checked={preferences[item.key]}
                  onCheckedChange={(checked: boolean) => onPreferenceChange(item.key, checked)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}