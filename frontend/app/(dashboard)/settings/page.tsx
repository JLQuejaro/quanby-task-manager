'use client';

import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <Header title="Settings" showSearch={false} />
      
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold dark:text-white">Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">Settings page - Coming soon!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}