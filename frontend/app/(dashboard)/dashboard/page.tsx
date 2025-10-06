'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/lib/types';
import { Plus, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { filterTasks } from '@/lib/utils';
import { isToday, isTomorrow, isPast, parseISO } from 'date-fns';

export default function DashboardPage() {
  const { tasks, isLoading, createTask, updateTask, deleteTask, toggleComplete } = useTasks();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Calculate task counts
  const taskCounts = {
    all: tasks.length,
    today: tasks.filter(t => t.deadline && isToday(parseISO(t.deadline)) && !t.completed).length,
    tomorrow: tasks.filter(t => t.deadline && isTomorrow(parseISO(t.deadline)) && !t.completed).length,
    upcoming: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
  };

  // Calculate stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    overdue: tasks.filter(t => t.deadline && isPast(parseISO(t.deadline)) && !t.completed).length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Filter tasks
  const filteredTasks = filterTasks(tasks, activeFilter);

  const handleCreateTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask({ id: editingTask.id, data: taskData });
      setEditingTask(null);
    } else {
      createTask(taskData);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingTask(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-[#4169E1]" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Completion Rate */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#4169E1]" />
              <h3 className="font-semibold text-gray-900">Completion Rate</h3>
            </div>
            <span className="text-2xl font-bold text-[#4169E1]">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-[#4169E1] h-3 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </Card>

        {/* Task Filters and New Task Button */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TaskFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            taskCounts={taskCounts}
          />
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-[#4169E1] hover:bg-[#3558CC]"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Task
          </Button>
        </div>

        {/* Task List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {activeFilter === 'all' && 'All Tasks'}
            {activeFilter === 'today' && "Today's Tasks"}
            {activeFilter === 'tomorrow' && "Tomorrow's Tasks"}
            {activeFilter === 'upcoming' && 'Upcoming Tasks'}
            {activeFilter === 'completed' && 'Completed Tasks'}
          </h2>
          <TaskList
            tasks={filteredTasks}
            onToggleComplete={toggleComplete}
            onEdit={handleEditTask}
            onDelete={deleteTask}
          />
        </div>
      </div>

      {/* Create/Edit Task Dialog */}
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleCreateTask}
        editTask={editingTask}
      />
    </div>
  );
}