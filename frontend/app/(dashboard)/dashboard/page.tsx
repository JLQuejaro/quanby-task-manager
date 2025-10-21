'use client';

import { useState, useMemo } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsDialog } from '@/components/shared/KeyboardShortcutsDialog';
import { Header } from '@/components/layout/Header';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/hooks/useTasks';
import { useTheme } from '@/contexts/ThemeContext';
import { Task } from '@/lib/types';
import { Plus, CheckCircle2, Clock, AlertCircle, Search } from 'lucide-react';
import { filterTasks } from '@/lib/utils';
import { isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const { tasks, isLoading, createTask, updateTask, deleteTask, toggleComplete } = useTasks();
  const { toggleTheme } = useTheme();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      callback: () => setIsCreateDialogOpen(true),
      preventDefault: true,
    },
    {
      key: '/',
      callback: () => {
        const searchInput = document.querySelector('input[placeholder="Search tasks..."]') as HTMLInputElement;
        searchInput?.focus();
      },
      preventDefault: true,
    },
    {
      key: '?',
      shiftKey: true,
      callback: () => setShowShortcutsDialog(true),
      preventDefault: true,
    },
    {
      key: '1',
      callback: () => setActiveFilter('all'),
      preventDefault: true,
    },
    {
      key: '2',
      callback: () => setActiveFilter('today'),
      preventDefault: true,
    },
    {
      key: '3',
      callback: () => setActiveFilter('tomorrow'),
      preventDefault: true,
    },
    {
      key: '4',
      callback: () => setActiveFilter('upcoming'),
      preventDefault: true,
    },
    {
      key: '5',
      callback: () => setActiveFilter('completed'),
      preventDefault: true,
    },
    {
      key: 'k',
      callback: () => toggleTheme(),
      preventDefault: true,
    },
    {
      key: 'r',
      shiftKey: true,
      callback: () => window.location.reload(),
      preventDefault: true,
    },
  ]);

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
    inProgress: tasks.filter(t => !t.completed && t.deadline && !isPast(parseISO(t.deadline))).length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Filter tasks with enhanced search
  const filteredTasks = useMemo(() => {
    let filtered = filterTasks(tasks, activeFilter);
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const searchTerms = searchLower.split(' ').filter(term => term.length > 0);
      
      filtered = filtered.filter(task => {
        const taskTitle = task.title.toLowerCase();
        const taskDescription = task.description?.toLowerCase() || '';
        const taskPriority = task.priority.toLowerCase();
        const taskContent = `${taskTitle} ${taskDescription} ${taskPriority}`;
        
        return searchTerms.every(term => 
          taskContent.includes(term)
        );
      });
      
      filtered.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aStartsWith = aTitle.startsWith(searchLower);
        const bStartsWith = bTitle.startsWith(searchLower);
        const aIncludes = aTitle.includes(searchLower);
        const bIncludes = bTitle.includes(searchLower);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        if (aIncludes && !bIncludes) return -1;
        if (!aIncludes && bIncludes) return 1;
        
        return 0;
      });
    }
    
    return filtered;
  }, [tasks, activeFilter, searchTerm]);

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
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-300">Total Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground dark:text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-300">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-300">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-300">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Task Progress & Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">Task Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm dark:text-gray-300">Completed</span>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 rounded-full">
                  {stats.completed} / {stats.total}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all" 
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{stats.inProgress}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">{stats.pending}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { priority: 'high', label: 'High Priority', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
                  { priority: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
                  { priority: 'low', label: 'Low Priority', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' }
                ].map(({ priority, label, color }) => {
                  const count = tasks.filter(t => t.priority === priority).length;
                  return (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm dark:text-gray-300">{label}</span>
                      <Badge variant="outline" className={`${color} rounded-full`}>{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Management */}
        <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">Tasks</CardTitle>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-[#4169E1] hover:bg-[#3558CC] rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              
              <TaskFilters
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                taskCounts={taskCounts}
              />
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No tasks found</p>
                </div>
              ) : (
                <TaskList
                  tasks={filteredTasks}
                  onToggleComplete={toggleComplete}
                  onEdit={handleEditTask}
                  onDelete={deleteTask}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Task Dialog */}
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleCreateTask}
        editTask={editingTask}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showShortcutsDialog}
        onClose={() => setShowShortcutsDialog(false)}
      />
    </div>
  );
}