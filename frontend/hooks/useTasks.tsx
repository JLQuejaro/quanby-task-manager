'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import { Task } from '@/lib/types';
import { useNotifications } from '@/contexts/NotificationContext';
import { useEffect } from 'react';

export function useTasks() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addNotification(
        'task_created',
        'Task Created',
        `"${newTask.title}" has been created successfully`,
        newTask.id
      );
    },
    onError: (error: any) => {
      addNotification(
        'task_created',
        'Error',
        error.response?.data?.message || 'Failed to create task',
        undefined
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) =>
      tasksApi.update(id, data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addNotification(
        'task_updated',
        'Task Updated',
        `"${updatedTask.title}" has been updated successfully`,
        updatedTask.id
      );
    },
    onError: (error: any) => {
      addNotification(
        'task_updated',
        'Error',
        error.response?.data?.message || 'Failed to update task',
        undefined
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Remove notification in localhost/development environment
      if (process.env.NODE_ENV !== 'development') {
        const task = tasks.find((t: Task) => t.id === id);
        addNotification(
          'task_deleted',
          'Task Deleted',
          `"${task?.title || 'Task'}" has been deleted`,
          id
        );
      }
    },
    onError: (error: any) => {
      addNotification(
        'task_deleted',
        'Error',
        error.response?.data?.message || 'Failed to delete task',
        undefined
      );
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: (id: number) => tasksApi.toggleComplete(id),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const isCompleted = updatedTask.completed;
      addNotification(
        'task_completed',
        isCompleted ? 'Task Completed' : 'Task Reopened',
        isCompleted
          ? `"${updatedTask.title}" has been marked as complete`
          : `"${updatedTask.title}" has been reopened`,
        updatedTask.id
      );
    },
    onError: (error: any) => {
      addNotification(
        'task_completed',
        'Error',
        error.response?.data?.message || 'Failed to update task',
        undefined
      );
    },
  });

  const toggleComplete = (id: number) => {
    toggleCompleteMutation.mutate(id);
  };

  const softDeleteTask = (id: number) => {
    const taskToDelete = tasks.find((t: Task) => t.id === id);
    if (!taskToDelete) return;

    updateMutation.mutate({
      id: taskToDelete.id,
      data: {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      },
    });
  };

  const deleteTask = (id: number) => {
    // Skip confirmation dialog in development/localhost
    if (process.env.NODE_ENV === 'development') {
      deleteMutation.mutate(id);
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this task? This action cannot be undone.'
    );

    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  // Deadline reminders and overdue tasks
  useEffect(() => {
    if (!tasks.length) return;
    const checkDeadlines = () => {
      const now = new Date();
      const notifiedKey = 'notified_tasks';
      const notified = JSON.parse(localStorage.getItem(notifiedKey) || '{}');
      tasks.forEach((task: Task) => {
        if (task.completed || !task.deadline || task.isDeleted) return;
        const deadline = new Date(task.deadline);
        const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        const taskKey = `${task.id}_${task.deadline}`;

        // 24-hour reminder
        if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 24) {
          if (!notified[`reminder_${taskKey}`]) {
            addNotification(
              'deadline_reminder',
              'Deadline Approaching',
              `"${task.title}" is due in ${Math.round(hoursUntilDeadline)} hours`,
              task.id,
              { hoursRemaining: Math.round(hoursUntilDeadline) }
            );
            notified[`reminder_${taskKey}`] = Date.now();
            localStorage.setItem(notifiedKey, JSON.stringify(notified));
          }
        }

        // Overdue alert
        if (hoursUntilDeadline < 0) {
          if (!notified[`overdue_${taskKey}`]) {
            const hoursOverdue = Math.abs(Math.round(hoursUntilDeadline));
            addNotification(
              'overdue_alert',
              'Task Overdue',
              `"${task.title}" is ${hoursOverdue} hour${hoursOverdue !== 1 ? 's' : ''} overdue`,
              task.id,
              { hoursOverdue }
            );
            notified[`overdue_${taskKey}`] = Date.now();
            localStorage.setItem(notifiedKey, JSON.stringify(notified));
          }
        }
      });
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tasks, addNotification]);

  return {
    tasks,
    isLoading,
    error,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    softDeleteTask,
    deleteTask,
    toggleComplete,
  };
}