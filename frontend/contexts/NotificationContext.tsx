'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Notification, NotificationType } from '@/lib/notification';
import { DynamicDeadlineNotifier, Task } from '@/lib/dynamic-deadline-notifier';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle, Info, Trash2, Bell, LogIn } from 'lucide-react';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (type: NotificationType, title: string, message: string, taskId?: number, metadata?: Record<string, any>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  currentUserEmail: string | null;
  setCurrentUserEmail: (email: string | null) => void;
  // Dynamic deadline notifier methods
  startDeadlineMonitoring: (tasks: Task[]) => void;
  stopDeadlineMonitoring: () => void;
  updateMonitoredTasks: (tasks: Task[]) => void;
  notifier: DynamicDeadlineNotifier | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [monitoredTasks, setMonitoredTasks] = useState<Task[]>([]);
  const notifierRef = useRef<DynamicDeadlineNotifier | null>(null);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get the storage key based on current user
  const getStorageKey = (userEmail?: string) => {
    if (!userEmail) return null;
    return `notifications_${userEmail}`;
  };

  // Initialize the dynamic deadline notifier
  useEffect(() => {
    if (!notifierRef.current) {
      notifierRef.current = new DynamicDeadlineNotifier(
        (type, title, message, taskId, displayDuration) => {
          // Add to in-app notifications (only for important deadline reminders)
          addNotification(type, title, message, taskId);
          
          // Show toast with custom duration
          const icon = getNotificationIcon(type);
          if (type === 'overdue_alert') {
            toast.error(message, { icon, duration: displayDuration });
          } else {
            toast(message, { icon, duration: displayDuration });
          }
        }
      );
    }
  }, []);

  // Load notifications when user email changes
  useEffect(() => {
    if (!currentUserEmail) {
      setNotifications([]);
      return;
    }

    const storageKey = getStorageKey(currentUserEmail);
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setNotifications(parsed.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt)
          })));
        } catch (e) {
          console.error('Failed to load notifications:', e);
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    }
  }, [currentUserEmail]);

  // Save notifications to storage
  useEffect(() => {
    if (!currentUserEmail) return;

    const storageKey = getStorageKey(currentUserEmail);
    if (storageKey) {
      if (notifications.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(notifications));
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  }, [notifications, currentUserEmail]);

  // Start monitoring tasks for deadline notifications
  const startDeadlineMonitoring = useCallback((tasks: Task[]) => {
    setMonitoredTasks(tasks);
    
    // Clear existing interval if any
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }

    // Check tasks every 2 minutes
    monitoringIntervalRef.current = setInterval(() => {
      if (notifierRef.current) {
        notifierRef.current.checkMultipleTasks(tasks);
      }
    }, 120000); // 2 minutes

    // Also check immediately
    if (notifierRef.current) {
      notifierRef.current.checkMultipleTasks(tasks);
    }
  }, []);

  // Stop monitoring
  const stopDeadlineMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    if (notifierRef.current) {
      notifierRef.current.clearAllHistory();
    }
  }, []);

  // Update the monitored tasks
  const updateMonitoredTasks = useCallback((tasks: Task[]) => {
    setMonitoredTasks(tasks);
  }, []);

  // Auto-restart monitoring when tasks change
  useEffect(() => {
    if (monitoredTasks.length > 0 && currentUserEmail) {
      startDeadlineMonitoring(monitoredTasks);
    }
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, [monitoredTasks, currentUserEmail]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
        return <Info className="h-5 w-5" />;
      case 'task_completed':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'task_deleted':
        return <Trash2 className="h-5 w-5" />;
      case 'deadline_reminder':
      case 'overdue_alert':
        return <AlertCircle className="h-5 w-5" />;
      case 'auth_status':
        return <LogIn className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    taskId?: number,
    metadata?: Record<string, any>
  ) => {
    if (!currentUserEmail) {
      console.warn('Cannot add notification: No user logged in');
      return;
    }

    // Only add to in-app notifications if it's important
    // Skip task_created, task_updated for in-app to reduce clutter
    const shouldAddToInApp = ![
      'task_created',
      'task_updated'
    ].includes(type);

    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      channel: ['toast', 'in_app'],
      read: false,
      createdAt: new Date(),
      taskId,
      metadata
    };

    // Only add important notifications to the in-app list
    if (shouldAddToInApp) {
      setNotifications(prev => [notification, ...prev]);
    }

    // Show toast notification with icon
    const icon = getNotificationIcon(type);
    
    if (type === 'task_created' || type === 'task_completed') {
      toast.success(message, { icon, duration: 3000 });
    } else if (type === 'task_deleted') {
      toast.error(message, { icon, duration: 3000 });
    } else if (type === 'overdue_alert') {
      toast.error(message, { icon, duration: 4000 });
    } else if (type === 'deadline_reminder') {
      toast(message, { icon, duration: 4000 });
    } else {
      toast(message, { icon, duration: 3000 });
    }
  }, [currentUserEmail]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    if (!currentUserEmail) return;
    
    setNotifications([]);
    const storageKey = getStorageKey(currentUserEmail);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [currentUserEmail]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        currentUserEmail,
        setCurrentUserEmail,
        startDeadlineMonitoring,
        stopDeadlineMonitoring,
        updateMonitoredTasks,
        notifier: notifierRef.current
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}