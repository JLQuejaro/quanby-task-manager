'use client';

import { useState, useMemo } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsDialog } from '@/components/shared/KeyboardShortcutsDialog';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';

export default function CalendarPage() {
  const { tasks, createTask, updateTask, deleteTask, toggleComplete } = useTasks();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      callback: () => setIsCreateDialogOpen(true),
      preventDefault: true,
    },
    {
      key: 'ArrowLeft',
      callback: () => goToPreviousMonth(),
      preventDefault: true,
    },
    {
      key: 'ArrowRight',
      callback: () => goToNextMonth(),
      preventDefault: true,
    },
    {
      key: 't',
      callback: () => {
        setSelectedDate(new Date());
        setCurrentMonth(new Date());
      },
      preventDefault: true,
    },
    {
      key: '?',
      shiftKey: true,
      callback: () => setShowShortcutsDialog(true),
      preventDefault: true,
    },
  ]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (task.deadline) {
        const dateKey = format(parseISO(task.deadline), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return tasksByDate[dateKey] || [];
  }, [selectedDate, tasksByDate]);

  // Get tasks for current month
  const monthTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = parseISO(task.deadline);
      return isSameMonth(taskDate, currentMonth);
    });
  }, [tasks, currentMonth]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Pad with previous month days
    const startDay = start.getDay();
    const prevMonthDays = [];
    for (let i = startDay - 1; i >= 0; i--) {
      const day = new Date(start);
      day.setDate(day.getDate() - (i + 1));
      prevMonthDays.push(day);
    }
    
    // Pad with next month days
    const endDay = end.getDay();
    const nextMonthDays = [];
    for (let i = 1; i < 7 - endDay; i++) {
      const day = new Date(end);
      day.setDate(day.getDate() + i);
      nextMonthDays.push(day);
    }
    
    return [...prevMonthDays, ...days, ...nextMonthDays];
  }, [currentMonth]);

  const monthStats = {
    total: monthTasks.length,
    completed: monthTasks.filter(task => task.completed).length,
    pending: monthTasks.filter(task => !task.completed).length,
    overdue: monthTasks.filter(task => {
      if (!task.deadline) return false;
      return parseISO(task.deadline) < new Date() && !task.completed;
    }).length
  };

  const handleCreateTask = (taskData: Partial<Task>) => {
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
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateDialogOpen(true);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <Header title="Calendar" />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2 space-y-6">
            {/* Month Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold dark:text-white">{monthStats.total}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{monthStats.completed}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{monthStats.pending}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{monthStats.overdue}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Overdue</div>
                  </div>
                </CardContent>
              </Card>
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
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={goToNextMonth}
                      className="rounded-xl"
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
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, index) => {
                      const dateKey = format(date, 'yyyy-MM-dd');
                      const dayTasks = tasksByDate[dateKey] || [];
                      const isCurrentMonthDay = isSameMonth(date, currentMonth);
                      const isSelected = isSameDay(date, selectedDate);
                      const isTodayDate = isToday(date);
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedDate(date)}
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
                              {dayTasks.slice(0, 3).map((_, i) => (
                                <div key={i} className="w-1 h-1 bg-current rounded-full opacity-60"></div>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
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
          </div>

          {/* Selected Date Tasks */}
          <div className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg dark:text-white">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-[#4169E1] hover:bg-[#3558CC] rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedDateTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>No tasks for this date</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 rounded-xl"
                        onClick={() => setIsCreateDialogOpen(true)}
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
                      onDelete={deleteTask}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats for Selected Date */}
            {selectedDateTasks.length > 0 && (
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">Day Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm dark:text-gray-300">Total Tasks</span>
                      <Badge variant="outline" className="rounded-full">{selectedDateTasks.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm dark:text-gray-300">Completed</span>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 rounded-full">
                        {selectedDateTasks.filter(task => task.completed).length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm dark:text-gray-300">Pending</span>
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 rounded-full">
                        {selectedDateTasks.filter(task => !task.completed).length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Task Dialog */}
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingTask(null);
        }}
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