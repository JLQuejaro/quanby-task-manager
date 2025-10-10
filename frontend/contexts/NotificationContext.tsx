'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Notification, NotificationType } from '@/lib/notification';
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        })));
      } catch (e) {
        console.error('Failed to load notifications:', e);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

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

    setNotifications(prev => [notification, ...prev]);

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
  }, []);

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
    setNotifications([]);
    localStorage.removeItem('notifications');
  }, []);

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
        clearAll
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