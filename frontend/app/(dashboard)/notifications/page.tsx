'use client';

import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Notifications" showSearch={false} />
      
      <div className="p-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-[#4169E1]" />
            <h2 className="text-xl font-semibold">Notifications</h2>
            <Badge className="bg-red-500">3</Badge>
          </div>
          <p className="text-gray-600">Your notifications will appear here.</p>
        </Card>
      </div>
    </div>
  );
}