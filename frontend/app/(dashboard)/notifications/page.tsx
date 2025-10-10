'use client';

import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Trash2, 
  LogIn,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationType } from '@/lib/notification';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAll 
  } = useNotifications();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'task_completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'task_deleted':
        return <Trash2 className="h-5 w-5 text-red-500" />;
      case 'deadline_reminder':
        return <Bell className="h-5 w-5 text-yellow-500" />;
      case 'overdue_alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'auth_status':
        return <LogIn className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type: NotificationType, read: boolean) => {
    if (read) return 'bg-gray-50 dark:bg-gray-900/50';
    
    switch (type) {
      case 'task_created':
      case 'task_updated':
        return 'bg-blue-50 dark:bg-blue-950/20';
      case 'task_completed':
        return 'bg-green-50 dark:bg-green-950/20';
      case 'task_deleted':
        return 'bg-red-50 dark:bg-red-950/20';
      case 'deadline_reminder':
        return 'bg-yellow-50 dark:bg-yellow-950/20';
      case 'overdue_alert':
        return 'bg-red-50 dark:bg-red-950/20';
      case 'auth_status':
        return 'bg-purple-50 dark:bg-purple-950/20';
      default:
        return 'bg-gray-50 dark:bg-gray-900/50';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <Header title="Notifications" showSearch={false} />
      
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {/* Header Card */}
        <Card className="p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-[#4169E1]" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Notifications List */}
        <Card className="rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Bell className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your notifications will appear here when you have updates
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    getNotificationBgColor(notification.type, notification.read)
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <Badge className="bg-[#4169E1] text-white text-xs">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 w-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-8 w-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400"
                            title="Delete"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}