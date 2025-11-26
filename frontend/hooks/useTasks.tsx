'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import { Task } from '@/lib/types';
import { useNotifications } from '@/contexts/NotificationContext';
import { useEffect } from 'react';

export function useTasks() {
  const queryClient = useQueryClient();
  const { addNotification, updateMonitoredTasks } = useNotifications();
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

  // Sync tasks with the global Dynamic Deadline Notifier
  useEffect(() => {
    if (!tasks) return;
    
    // Map the API tasks to the format expected by the notifier
    // The notifier expects: id, title, dueDate (mapped from deadline), completed, priority
    const monitoredTasks = tasks.map((t: Task) => ({
      id: t.id,
      title: t.title,
      dueDate: t.deadline,
      completed: t.completed,
      priority: t.priority
    }));

    updateMonitoredTasks(monitoredTasks);
  }, [tasks, updateMonitoredTasks]);

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