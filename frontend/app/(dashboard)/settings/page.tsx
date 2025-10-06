'use client';

import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Settings" showSearch={false} />
      
      <div className="p-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          <p className="text-gray-600">Settings page - Coming soon!</p>
        </Card>
      </div>
    </div>
  );
}