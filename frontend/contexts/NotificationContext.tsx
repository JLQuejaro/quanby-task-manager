'use client';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Notification, NotificationType } from '@/lib/notification';
import { DynamicDeadlineNotifier, Task } from '@/lib/dynamic-deadline-notifier';
import { NotificationPreferences } from '@/components/settings/types';
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

  // Helper: Get notification preferences
  const getPreferences = (userEmail: string): NotificationPreferences => {
    try {
      const key = `notification_preferences_${userEmail}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load notification preferences:', e);
    }
    // Default preferences
    return {
      emailNotifications: true,
      pushNotifications: true,
      taskReminders: true,
      deadlineAlerts: true,
    };
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
        return <Info className="h-5 w-5" />;
      case 'task_completed':
      case 'auth_success':
      case 'password_changed':
      case 'verification_resent':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'task_deleted':
      case 'auth_error':
      case 'password_change_failed':
      case 'resend_failed':
        return <Trash2 className="h-5 w-5" />;
      case 'deadline_reminder':
      case 'overdue_alert':
      case 'auth_conflict':
      case 'verification_required':
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
    // Allow toasts even when no user is logged in; only persist in-app when a user is present
    const allowInApp = !!currentUserEmail;

    // Get preferences if user is logged in
    const prefs = currentUserEmail ? getPreferences(currentUserEmail) : { pushNotifications: true };

    // Only add to in-app notifications if it's important and a user is present
    const shouldAddToInApp = allowInApp && ![
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

    if (shouldAddToInApp) {
      setNotifications(prev => [notification, ...prev]);
    }

    // Check if push notifications (toasts) are enabled
    if (prefs.pushNotifications) {
      // Show toast notification with icon regardless of login state
      const icon = getNotificationIcon(type);
      const duration = metadata?.displayDuration || (['overdue_alert', 'deadline_reminder'].includes(type) ? 2500 : 2000);

      if (type === 'task_created' || type === 'task_completed') {
        toast.success(message, { icon, duration: 1500 });
      } else if (type === 'task_deleted') {
        toast.error(message, { icon, duration: 1500 });
      } else if (type === 'overdue_alert') {
        toast.error(message, { icon, duration });
      } else if (type === 'deadline_reminder') {
        toast(message, { icon, duration });
      } else {
        toast(message, { icon, duration });
      }
    }
  }, [currentUserEmail]);

  // Initialize the dynamic deadline notifier
  useEffect(() => {
    if (!notifierRef.current) {
      notifierRef.current = new DynamicDeadlineNotifier(
        (type, title, message, taskId, displayDuration) => {
          // Check preferences before notifying
          if (currentUserEmail) {
            const prefs = getPreferences(currentUserEmail);
            
            // Check Task Reminders preference
            if (type === 'deadline_reminder' && !prefs.taskReminders) {
              return;
            }
            
            // Check Deadline Alerts preference
            if (type === 'overdue_alert' && !prefs.deadlineAlerts) {
              return;
            }
          }

          // Add to in-app notifications (addNotification handles toast preference check)
          addNotification(type, title, message, taskId, { displayDuration });
        }
      );
    }
  }, [addNotification, currentUserEmail]); // Re-create notifier if user changes to ensure prefs are fresh? 
  // Actually notifier is a ref, so we shouldn't re-create it. But the callback captures scope. 
  // We should probably update the callback or let the callback read ref/state.
  // Since `addNotification` is a dependency and changes with `currentUserEmail`, 
  // and we use `currentUserEmail` inside the callback, we should re-instantiate or update the callback.
  // However, `notifierRef.current` is only created ONCE. The closure will capture the INITIAL `addNotification` and `currentUserEmail`.
  // This is a BUG in the original code too if `addNotification` changes.
  // BUT `addNotification` depends on `currentUserEmail`.
  // We should assign the callback to the notifier instance if it supports it, or use a ref for the callback.
  // DynamicDeadlineNotifier takes callback in constructor.
  
  // FIX: Use a ref for addNotification and currentUserEmail so the stable callback can access current values
  const addNotificationRef = useRef(addNotification);
  const currentUserEmailRef = useRef(currentUserEmail);

  useEffect(() => {
    addNotificationRef.current = addNotification;
    currentUserEmailRef.current = currentUserEmail;
  }, [addNotification, currentUserEmail]);

  // Re-initialize notifier to use refs (or just fix the callback to use refs)
  // Since we can't easily change the callback in the class without a setter, let's re-create it if strictly needed,
  // OR just make the callback use the refs.
  // The `useEffect` above with `!notifierRef.current` only runs once.
  // So we MUST use refs inside the callback.

  // Initialize the dynamic deadline notifier
  useEffect(() => {
    if (!notifierRef.current) {
      notifierRef.current = new DynamicDeadlineNotifier(
        (type, title, message, taskId, displayDuration) => {
          const email = currentUserEmailRef.current;
          const notify = addNotificationRef.current;

          // Check preferences before notifying
          if (email) {
            const prefs = getPreferences(email);
            
            // Check Task Reminders preference
            if (type === 'deadline_reminder' && !prefs.taskReminders) {
              return;
            }
            
            // Check Deadline Alerts preference
            if (type === 'overdue_alert' && !prefs.deadlineAlerts) {
              return;
            }
          }

          // Add to in-app notifications (addNotification handles toast preference check)
          notify(type, title, message, taskId, { displayDuration });
          
          // Save notifier history to prevent re-sending notifications on refresh
          if (notifierRef.current && email) {
             try {
               const history = notifierRef.current.getHistory();
               const key = `deadline_notifier_history_${email}`;
               localStorage.setItem(key, JSON.stringify(history));
             } catch (e) {
               console.error('Failed to save notifier history:', e);
             }
          }
        }
      );
    }
  }, []); // Run once, use refs for dependencies

  // Load notifications AND notifier history when user email changes
  useEffect(() => {
    if (!currentUserEmail) {
      setNotifications([]);
      // Clear notifier history if user logs out
      if (notifierRef.current) {
        notifierRef.current.restoreHistory([]); // Clear by restoring empty
      }
      return;
    }
    
    // 1. Load User Notifications
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
      }
    } else {
        setNotifications([]);
      }

    // 2. Load Notifier History
    const historyKey = `deadline_notifier_history_${currentUserEmail}`;
    const storedHistory = localStorage.getItem(historyKey);
    if (storedHistory && notifierRef.current) {
       try {
         const history = JSON.parse(storedHistory);
         notifierRef.current.restoreHistory(history);
       } catch(e) {
         console.error('Failed to load notifier history:', e);
       }
    }
  }, [currentUserEmail]);

  // Save notifications to storage
  useEffect(() => {
    if (!currentUserEmail) return;
    const storageKey = getStorageKey(currentUserEmail);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    }
  }, [notifications, currentUserEmail]);

  // Start monitoring tasks for deadline notifications
  const startDeadlineMonitoring = useCallback((tasks: Task[]) => {
    setMonitoredTasks(tasks);

    // Clear existing interval if any
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }
    // Check tasks every 10 seconds
    monitoringIntervalRef.current = setInterval(() => {
      if (notifierRef.current) {
        notifierRef.current.checkMultipleTasks(tasks);
      }
    }, 10000); // 10 seconds
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
