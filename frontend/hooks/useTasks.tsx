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
        error.response?.data?.message || 'Failed to create task'
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
        error.response?.data?.message || 'Failed to update task'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const task = tasks.find(t => t.id === id);
      addNotification(
        'task_deleted',
        'Task Deleted',
        `"${task?.title || 'Task'}" has been deleted`,
        id
      );
    },
    onError: (error: any) => {
      addNotification(
        'task_deleted',
        'Error',
        error.response?.data?.message || 'Failed to delete task'
      );
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      tasksApi.toggleComplete(id, completed),
    onSuccess: (updatedTask, { completed }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addNotification(
        'task_completed',
        completed ? 'Task Completed' : 'Task Reopened',
        completed 
          ? `"${updatedTask.title}" has been marked as complete` 
          : `"${updatedTask.title}" has been reopened`,
        updatedTask.id
      );
    },
    onError: (error: any) => {
      addNotification(
        'task_completed',
        'Error',
        error.response?.data?.message || 'Failed to update task'
      );
    },
  });

  const toggleComplete = (id: number, completed: boolean) => {
    toggleCompleteMutation.mutate({ id, completed });
  };

  const deleteTask = (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this task? This action cannot be undone.'
    );
    
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  // Check for deadline reminders and overdue tasks
  useEffect(() => {
    if (!tasks.length) return;

    const checkDeadlines = () => {
      const now = new Date();
      const checkedToday = localStorage.getItem('deadlines_checked_today');
      const today = now.toDateString();

      // Only check once per day to avoid spam
      if (checkedToday === today) return;

      tasks.forEach(task => {
        if (task.completed || !task.deadline) return;

        const deadline = new Date(task.deadline);
        const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Reminder 24 hours before deadline
        if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 24) {
          addNotification(
            'deadline_reminder',
            'Deadline Approaching',
            `"${task.title}" is due in ${Math.round(hoursUntilDeadline)} hours`,
            task.id
          );
        }
        
        // Overdue alert
        if (hoursUntilDeadline < 0 && hoursUntilDeadline > -24) {
          addNotification(
            'overdue_alert',
            'Task Overdue',
            `"${task.title}" is overdue`,
            task.id
          );
        }
      });

      localStorage.setItem('deadlines_checked_today', today);
    };

    // Check on mount and every hour
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks, addNotification]);

  return {
    tasks,
    isLoading,
    error,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask,
    toggleComplete,
  };
}