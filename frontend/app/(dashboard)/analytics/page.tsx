'use client';

import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { BarChart3, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  const { tasks } = useTasks();

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    highPriority: tasks.filter(t => t.priority === 'high').length,
    mediumPriority: tasks.filter(t => t.priority === 'medium').length,
    lowPriority: tasks.filter(t => t.priority === 'low').length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Analytics" />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overview Card */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-[#4169E1]" />
              <h3 className="font-semibold text-gray-900">Task Overview</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Tasks</span>
                <span className="font-semibold">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{stats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-orange-600">{stats.pending}</span>
              </div>
            </div>
          </Card>

          {/* Priority Breakdown */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-[#4169E1]" />
              <h3 className="font-semibold text-gray-900">Priority Breakdown</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">High Priority</span>
                <span className="font-semibold text-red-600">{stats.highPriority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Medium Priority</span>
                <span className="font-semibold text-orange-600">{stats.mediumPriority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Low Priority</span>
                <span className="font-semibold text-green-600">{stats.lowPriority}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Completion Rate */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-[#4169E1]" />
            <h3 className="font-semibold text-gray-900">Completion Rate</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-[#4169E1] h-4 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
            <span className="text-2xl font-bold text-[#4169E1]">{completionRate}%</span>
          </div>
        </Card>
      </div>
    </div>
  );
}