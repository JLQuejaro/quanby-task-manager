'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsDialog } from '@/components/shared/KeyboardShortcutsDialog';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { useTasks } from '@/hooks/useTasks';
import { useTheme } from '@/contexts/ThemeContext';
import { Task } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
} from 'date-fns';

// Helper: Generate calendar days for a given month
const generateCalendarDays = (currentMonth: Date): Date[] => {
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  const startDay = start.getDay();
  const prevMonthDays = Array.from({ length: startDay }, (_, i: number) => {
    const day = new Date(start);
    day.setDate(day.getDate() - (startDay - i));
    return day;
  });

  const endDay = end.getDay();
  const nextMonthDays = Array.from({ length: 6 - endDay }, (_, i: number) => {
    const day = new Date(end);
    day.setDate(day.getDate() + i + 1);
    return day;
  });

  return [...prevMonthDays, ...days, ...nextMonthDays];
};

// Helper: Group tasks by date
const groupTasksByDate = (tasks: Task[]): Record<string, Task[]> => {
  const grouped: Record<string, Task[]> = {};
  tasks.forEach((task: Task) => {
    if (!task.isDeleted && task.deadline) {
      const dateKey = format(parseISO(task.deadline), 'yyyy-MM-dd');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(task);
    }
  });
  return grouped;
};

// Helper: Filter tasks by date range
const filterTasksByRange = (tasks: Task[], start: Date, end: Date): Task[] => {
  return tasks.filter((task: Task) => {
    if (!task.deadline || task.isDeleted) return false;
    const taskDate = parseISO(task.deadline);
    return taskDate >= start && taskDate <= end;
  });
};

export default function CalendarPage() {
  const { tasks: allTasks, createTask, updateTask, deleteTask: permanentDeleteTask, toggleComplete } = useTasks();
  const { toggleTheme } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [trash, setTrash] = useState<Task[]>([]);

  const tasks = useMemo(() => allTasks.filter((task: Task) => !task.isDeleted), [allTasks]);

  useEffect(() => {
    setTrash(allTasks.filter((task: Task) => task.isDeleted));
  }, [allTasks]);

  // Handlers
  const goToPreviousMonth = useCallback(() => setCurrentMonth((prev: Date) => subMonths(prev, 1)), []);
  const goToNextMonth = useCallback(() => setCurrentMonth((prev: Date) => addMonths(prev, 1)), []);
  const goToToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'n', callback: () => setIsCreateDialogOpen(true), preventDefault: true },
    { key: 'ArrowLeft', callback: goToPreviousMonth, preventDefault: true },
    { key: 'ArrowRight', callback: goToNextMonth, preventDefault: true },
    { key: 't', callback: goToToday, preventDefault: true },
    { key: 'k', callback: toggleTheme, preventDefault: true },
    { key: '?', shiftKey: true, callback: () => setShowShortcutsDialog(true), preventDefault: true },
    { key: 'r', shiftKey: true, callback: () => window.location.reload(), preventDefault: true },
  ]);

  // Soft-delete: Move task to trash
  const handleDeleteTask = useCallback((id: number) => {
    const taskToDelete = tasks.find((task: Task) => task.id === id);
    if (!taskToDelete) return;

    updateTask({
      id: taskToDelete.id,
      data: {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      },
    });
  }, [tasks, updateTask]);

  // Recover task from trash
  const handleRecoverTask = useCallback((id: number) => {
    const taskToRecover = trash.find((task: Task) => task.id === id);
    if (!taskToRecover) return;

    updateTask({
      id: taskToRecover.id,
      data: {
        isDeleted: false,
        deletedAt: undefined,
      },
    });
  }, [trash, updateTask]);

  // Permanently delete tasks older than 30 days
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      trash.forEach((task: Task) => {
        if (!task.deletedAt) return;
        const deletedDate = new Date(task.deletedAt);
        const daysSinceDeletion = (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDeletion >= 30) {
          permanentDeleteTask(task.id);
        }
      });
    }, 24 * 60 * 60 * 1000); // Check daily

    return () => clearInterval(interval);
  }, [trash, permanentDeleteTask]);

  // Memoized data
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const calendarDays = useMemo(() => generateCalendarDays(currentMonth), [currentMonth]);
  const selectedDateTasks = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return tasksByDate[dateKey] || [];
  }, [selectedDate, tasksByDate]);

  const monthTasks = useMemo(() => (
    filterTasksByRange(tasks, startOfMonth(currentMonth), endOfMonth(currentMonth))
  ), [tasks, currentMonth]);

  const weekTasks = useMemo(() => {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = endOfWeek(selectedDate);
    return filterTasksByRange(tasks, weekStart, weekEnd);
  }, [tasks, selectedDate]);

  const yearTasks = useMemo(() => {
    const yearStart = startOfYear(selectedDate);
    const yearEnd = endOfYear(selectedDate);
    return filterTasksByRange(tasks, yearStart, yearEnd);
  }, [tasks, selectedDate]);

  const monthStats = useMemo(() => ({
    total: monthTasks.length,
    completed: monthTasks.filter((task: Task) => task.completed).length,
    pending: monthTasks.filter((task: Task) => !task.completed).length,
    overdue: monthTasks.filter((task: Task) => (
      !task.completed && task.deadline && parseISO(task.deadline) < new Date()
    )).length,
  }), [monthTasks]);

  // Task handlers
  const handleCreateTask = useCallback((taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask({ id: editingTask.id, data: taskData });
      setEditingTask(null);
    } else {
      const taskWithDate = {
        ...taskData,
        deadline: format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss") + 'Z',
      };
      createTask(taskWithDate);
    }
    setIsCreateDialogOpen(false);
  }, [editingTask, selectedDate, createTask, updateTask]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreateDialogOpen(true);
  }, []);

  // Render helpers
  const renderCalendarDay = useCallback((date: Date, index: number) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayTasks = tasksByDate[dateKey] || [];
    const isCurrentMonthDay = isSameMonth(date, currentMonth);
    const isSelected = isSameDay(date, selectedDate);
    const isTodayDate = isToday(date);

    return (
      <button
        key={index}
        onClick={() => setSelectedDate(date)}
        aria-label={`Select date ${format(date, 'MMMM d, yyyy')}`}
        className={`
          relative p-2 min-h-[40px] text-sm rounded-xl transition-colors
          ${isSelected ? 'bg-[#4169E1] text-white' : ''}
          ${isTodayDate && !isSelected ? 'bg-blue-100 text-blue-900 font-semibold dark:bg-blue-900 dark:text-blue-100' : ''}
          ${!isCurrentMonthDay ? 'text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}
          ${!isSelected && isCurrentMonthDay ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : ''}
        `}
      >
        <span>{format(date, 'd')}</span>
        {dayTasks.length > 0 && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            {dayTasks.slice(0, 3).map((_, i: number) => (
              <div key={i} className="w-1 h-1 bg-current rounded-full opacity-60"></div>
            ))}
          </div>
        )}
      </button>
    );
  }, [currentMonth, selectedDate, tasksByDate]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <Header title="Calendar" />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2 space-y-6">
            {/* Month Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Tasks', value: monthStats.total, color: '' },
                { label: 'Completed', value: monthStats.completed, color: 'text-green-600' },
                { label: 'Pending', value: monthStats.pending, color: 'text-orange-600' },
                { label: 'Overdue', value: monthStats.overdue, color: 'text-red-600' },
              ].map((stat, i: number) => (
                <Card key={i} className="rounded-2xl">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Calendar */}
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousMonth}
                      className="rounded-xl"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToToday}
                      className="rounded-xl"
                      aria-label="Today"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextMonth}
                      className="rounded-xl"
                      aria-label="Next month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full">
                  {/* Calendar Header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day: string) => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map(renderCalendarDay)}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#4169E1]"></div>
                    <span className="dark:text-gray-300">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                    <span className="dark:text-gray-300">Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                    <span className="dark:text-gray-300">Has Tasks</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Summary */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Day', tasks: selectedDateTasks },
                  { label: 'Week', tasks: weekTasks },
                  { label: 'Year', tasks: yearTasks },
                ].map((summary, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{summary.label}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-500">{summary.tasks.length}</span>
                      <span className="text-green-600 dark:text-green-500">
                        {summary.tasks.filter((t: Task) => t.completed).length}
                      </span>
                      <span className="text-orange-600 dark:text-orange-500">
                        {summary.tasks.filter((t: Task) => !t.completed).length}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-500">Total</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-500">Done</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-500">Pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Tasks */}
          <div className="space-y-6">
            <Card className="rounded-2xl min-h-[795px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg dark:text-white">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-[#4169E1] hover:bg-[#3558CC] rounded-xl"
                    aria-label="Add task"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedDateTasks.length === 0 ? (
                    <div className="text-center py-60 text-gray-500 dark:text-gray-400">
                      <p>No tasks for this date</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 rounded-xl"
                        onClick={() => setIsCreateDialogOpen(true)}
                        aria-label="Add first task"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Task
                      </Button>
                    </div>
                  ) : (
                    <TaskList
                      tasks={selectedDateTasks}
                      onToggleComplete={toggleComplete}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Trash Section */}
      <div className="p-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Trash</CardTitle>
          </CardHeader>
          <CardContent>
            {trash.length > 0 ? (
              <TaskList
                tasks={trash}
                onToggleComplete={() => {}}
                onEdit={() => {}}
                onDelete={handleRecoverTask}
              />
            ) : (
              <p className="text-center py-12 text-gray-500 dark:text-gray-400">No tasks in trash.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateTask}
        editTask={editingTask}
      />
      <KeyboardShortcutsDialog
        open={showShortcutsDialog}
        onClose={() => setShowShortcutsDialog(false)}
      />
    </div>
  );
}
