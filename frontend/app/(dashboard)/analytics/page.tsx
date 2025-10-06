'use client';

import { useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/hooks/useTasks';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Target,
  Award
} from 'lucide-react';
import { isToday, isTomorrow, isPast, parseISO, isThisWeek, isThisMonth } from 'date-fns';

export default function AnalyticsPage() {
  const { tasks } = useTasks();

  const analytics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;

    // Time-based analytics
    const todayTasks = tasks.filter(t => 
      t.deadline && isToday(parseISO(t.deadline)) && !t.completed
    ).length;
    
    const thisWeekTasks = tasks.filter(t => 
      t.deadline && isThisWeek(parseISO(t.deadline)) && !t.completed
    ).length;
    
    const thisMonthTasks = tasks.filter(t => 
      t.deadline && isThisMonth(parseISO(t.deadline))
    ).length;

    // Overdue tasks
    const overdueTasks = tasks.filter(t => 
      t.deadline && isPast(parseISO(t.deadline)) && !t.completed
    ).length;

    // Priority distribution
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium');
    const lowPriorityTasks = tasks.filter(t => t.priority === 'low');

    const highPriorityCompleted = highPriorityTasks.filter(t => t.completed).length;
    const highPriorityRate = highPriorityTasks.length > 0 
      ? (highPriorityCompleted / highPriorityTasks.length) * 100 
      : 0;

    // Completion rates
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const weeklyCompleted = tasks.filter(t => 
      t.deadline && isThisWeek(parseISO(t.deadline)) && t.completed
    ).length;
    const weeklyProductivity = thisWeekTasks > 0 
      ? (weeklyCompleted / thisWeekTasks) * 100 
      : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      todayTasks,
      thisWeekTasks,
      thisMonthTasks,
      overdueTasks,
      completionRate,
      weeklyProductivity,
      highPriorityRate,
      priorityStats: {
        high: highPriorityTasks.length,
        medium: mediumPriorityTasks.length,
        low: lowPriorityTasks.length,
      },
    };
  }, [tasks]);

  const getPerformanceMessage = () => {
    if (analytics.completionRate >= 80) return { message: "Excellent performance!", color: "text-green-600" };
    if (analytics.completionRate >= 60) return { message: "Good progress!", color: "text-blue-600" };
    if (analytics.completionRate >= 40) return { message: "Keep pushing!", color: "text-yellow-600" };
    return { message: "Let's focus!", color: "text-red-600" };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Analytics" />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your productivity and task performance</p>
          </div>
          <div className="text-right">
            <div className={`text-xl font-semibold ${performance.color}`}>
              {performance.message}
            </div>
            <div className="text-sm text-gray-500">
              Overall completion: {analytics.completionRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Tasks</span>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.totalTasks}</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <Target className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-[#4169E1]">{analytics.completionRate.toFixed(1)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-[#4169E1] h-2 rounded-full transition-all"
                style={{ width: `${analytics.completionRate}%` }}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">This Week</span>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.thisWeekTasks}</div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.weeklyProductivity.toFixed(1)}% completed
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overdue</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{analytics.overdueTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Needs attention</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Status Distribution */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-[#4169E1]" />
              <h3 className="font-semibold text-gray-900">Task Status Distribution</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.completedTasks}</span>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    {analytics.totalTasks > 0 ? ((analytics.completedTasks / analytics.totalTasks) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.pendingTasks}</span>
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                    {analytics.totalTasks > 0 ? ((analytics.pendingTasks / analytics.totalTasks) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="flex h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500" 
                    style={{ width: `${analytics.totalTasks > 0 ? (analytics.completedTasks / analytics.totalTasks) * 100 : 0}%` }}
                  />
                  <div 
                    className="bg-orange-500" 
                    style={{ width: `${analytics.totalTasks > 0 ? (analytics.pendingTasks / analytics.totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Priority Analysis */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-[#4169E1]" />
              <h3 className="font-semibold text-gray-900">Priority Analysis</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm">High Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.priorityStats.high}</span>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                    {analytics.highPriorityRate.toFixed(1)}% done
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-sm">Medium Priority</span>
                </div>
                <span className="text-sm font-medium">{analytics.priorityStats.medium}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">Low Priority</span>
                </div>
                <span className="text-sm font-medium">{analytics.priorityStats.low}</span>
              </div>

              {analytics.priorityStats.high > 0 && (
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">High Priority Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${analytics.highPriorityRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Focus on completing high priority tasks first
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Time-based Insights */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-[#4169E1]" />
              <h3 className="font-semibold text-gray-900">Time-based Insights</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-[#4169E1]">{analytics.todayTasks}</div>
                  <div className="text-sm text-gray-600">Due Today</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analytics.thisWeekTasks}</div>
                  <div className="text-sm text-gray-600">This Week</div>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-2">Weekly Productivity</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-[#4169E1] h-2 rounded-full transition-all"
                    style={{ width: `${analytics.weeklyProductivity}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {analytics.weeklyProductivity >= 70 ? "Great week! Keep it up!" : 
                   analytics.weeklyProductivity >= 50 ? "Good progress this week" : 
                   "Room for improvement this week"}
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">{analytics.thisMonthTasks}</div>
                <div className="text-sm text-gray-600">Tasks This Month</div>
              </div>
            </div>
          </Card>

          {/* Recommendations */}
          {(analytics.overdueTasks > 0 || analytics.highPriorityRate < 50) && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-semibold">Recommendations</h3>
              </div>
              <div className="space-y-3">
                {analytics.overdueTasks > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <Clock className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-red-700 text-sm">Address Overdue Tasks</div>
                      <div className="text-xs text-red-600">
                        You have {analytics.overdueTasks} overdue tasks. Consider rescheduling or completing them soon.
                      </div>
                    </div>
                  </div>
                )}
                
                {analytics.highPriorityRate < 50 && analytics.priorityStats.high > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <Target className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-orange-700 text-sm">Focus on High Priority</div>
                      <div className="text-xs text-orange-600">
                        Only {analytics.highPriorityRate.toFixed(1)}% of high priority tasks are completed.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}