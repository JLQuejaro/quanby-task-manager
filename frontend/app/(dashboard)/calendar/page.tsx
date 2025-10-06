'use client';

import { Header } from '@/components/layout/Header';

export default function CalendarPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Calendar" />
      
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Calendar View</h2>
          <p className="text-gray-600 mt-2">Coming soon! Calendar view will be implemented here.</p>
        </div>
      </div>
    </div>
  );
}