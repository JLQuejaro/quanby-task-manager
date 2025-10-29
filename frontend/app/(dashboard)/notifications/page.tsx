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
  X,
  RotateCcw,
  Archive,
  Key,
  Shield,
  Mail,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationType } from '@/lib/notification';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
} from 'react';

/* ------------------------------------------------------------------ */
/* Types – align with what your context actually returns              */
/* ------------------------------------------------------------------ */
type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const getNotificationIcon = (type: NotificationType) => {
  const map: Record<NotificationType, React.ReactNode> = {
    // Task notifications
    task_created: <Info className="h-5 w-5 text-blue-500" />,
    task_updated: <Info className="h-5 w-5 text-blue-500" />,
    task_completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    task_deleted: <Trash2 className="h-5 w-5 text-red-500" />,
    task_restored: <RotateCcw className="h-5 w-5 text-green-500" />,
    
    // Deadline notifications
    deadline_reminder: <Bell className="h-5 w-5 text-yellow-500" />,
    overdue_alert: <AlertCircle className="h-5 w-5 text-red-500" />,
    
    // Archive notifications
    archive_cleared: <Archive className="h-5 w-5 text-orange-500" />,
    
    // Auth notifications
    auth_status: <LogIn className="h-5 w-5 text-purple-500" />,
    auth_success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    auth_error: <XCircle className="h-5 w-5 text-red-500" />,
    auth_conflict: <AlertCircle className="h-5 w-5 text-orange-500" />,
    
    // Password notifications
    password_changed: <Key className="h-5 w-5 text-green-500" />,
    password_change_failed: <XCircle className="h-5 w-5 text-red-500" />,
    
    // Verification notifications
    verification_required: <Mail className="h-5 w-5 text-blue-500" />,
    verification_resent: <Mail className="h-5 w-5 text-green-500" />,
    resend_failed: <XCircle className="h-5 w-5 text-red-500" />,
    
    // Default/error fallback
    error: <XCircle className="h-5 w-5 text-red-500" />,
  };
  return map[type] ?? <Bell className="h-5 w-5 text-gray-500" />;
};

const getNotificationBgColor = (type: NotificationType, read: boolean) => {
  if (read) return 'bg-gray-50 dark:bg-gray-900/50';
  const colorMap: Record<NotificationType, string> = {
    // Task notifications
    task_created: 'bg-blue-50 dark:bg-blue-950/20',
    task_updated: 'bg-blue-50 dark:bg-blue-950/20',
    task_completed: 'bg-green-50 dark:bg-green-950/20',
    task_deleted: 'bg-red-50 dark:bg-red-950/20',
    task_restored: 'bg-green-50 dark:bg-green-950/20',
    
    // Deadline notifications
    deadline_reminder: 'bg-yellow-50 dark:bg-yellow-950/20',
    overdue_alert: 'bg-red-50 dark:bg-red-950/20',
    
    // Archive notifications
    archive_cleared: 'bg-orange-50 dark:bg-orange-950/20',
    
    // Auth notifications
    auth_status: 'bg-purple-50 dark:bg-purple-950/20',
    auth_success: 'bg-green-50 dark:bg-green-950/20',
    auth_error: 'bg-red-50 dark:bg-red-950/20',
    auth_conflict: 'bg-orange-50 dark:bg-orange-950/20',
    
    // Password notifications
    password_changed: 'bg-green-50 dark:bg-green-950/20',
    password_change_failed: 'bg-red-50 dark:bg-red-950/20',
    
    // Verification notifications
    verification_required: 'bg-blue-50 dark:bg-blue-950/20',
    verification_resent: 'bg-green-50 dark:bg-green-950/20',
    resend_failed: 'bg-red-50 dark:bg-red-950/20',
    
    // Default/error fallback
    error: 'bg-red-50 dark:bg-red-950/20',
  };
  return colorMap[type] ?? 'bg-gray-50 dark:bg-gray-900/50';
};

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */
export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  /* ------------ optimistic delete + undo toast -------------------- */
  const [deleted, setDeleted] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<
    { id: string; timeout: NodeJS.Timeout }[]
  >([]);

  const handleDelete = (id: string) => {
    setDeleted((d) => [...d, id]);
    const t = setTimeout(() => {
      deleteNotification(id);
      setUndoStack((u) => u.filter((x) => x.id !== id));
    }, 4000);
    setUndoStack((u) => [...u, { id, timeout: t }]);
  };

  const handleUndo = (id: string) => {
    setUndoStack((u) => {
      const item = u.find((x) => x.id === id);
      if (item) clearTimeout(item.timeout);
      return u.filter((x) => x.id !== id);
    });
    setDeleted((d) => d.filter((x) => x !== id));
  };

  /* ------------ keyboard navigation ------------------------------- */
  const listRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(-1);

  useEffect(() => {
    if (!listRef.current) return;
    const items = Array.from(
      listRef.current.querySelectorAll<HTMLDivElement>('[role="listitem"]')
    );
    items[focusIndex]?.focus();
  }, [focusIndex]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const max = notifications.length - 1;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((i) => (i >= max ? 0 : i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((i) => (i <= 0 ? max : i - 1));
    }
  };

  /* ------------ grouping ----------------------------------------- */
  const groups = {
    Today: notifications.filter((n) => isToday(n.createdAt)),
    Yesterday: notifications.filter((n) => isYesterday(n.createdAt)),
    Earlier: notifications.filter(
      (n) => !isToday(n.createdAt) && !isYesterday(n.createdAt)
    ),
  };

  /* ------------ render ------------------------------------------- */
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 min-h-screen">
      <Header title="Notifications" showSearch={false} />

      <div className="p-6 max-w-4xl mx-auto space-y-4 min-h-[calc(100vh-80px)]">
        {/* ---- header card ---- */}
        <Card className="p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Bell className="h-6 w-6 text-[#4169E1]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Notifications
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'All caught up!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  className="rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* ---- list ---- */}
        <Card
          ref={listRef}
          onKeyDown={onKeyDown}
          className="rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
          role="list"
          aria-label="Notifications"
          tabIndex={0}
        >
          {notifications.length === 0 ? (
            <Empty />
          ) : (
            <>
              {Object.entries(groups).map(
                ([title, items]) =>
                  items.length > 0 && (
                    <Section
                      key={title}
                      title={title}
                      items={items}
                      deleted={deleted}
                      onUndo={handleUndo}
                      onDelete={handleDelete}
                      onRead={markAsRead}
                      focusOffset={notifications.findIndex(
                        (n) => n.id === items[0].id
                      )}
                      focusIndex={focusIndex}
                    />
                  )
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */
function Empty() {
  return (
    <div className="text-center py-16 px-6 flex flex-col items-center justify-center min-h-[calc(100vh-350px)]">
      <div className="p-6 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <Bell className="h-16 w-16 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No notifications yet
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
        Important notifications like deadline reminders will appear here
      </p>
    </div>
  );
}

function Section({
  title,
  items,
  deleted,
  onUndo,
  onDelete,
  onRead,
  focusOffset,
  focusIndex,
}: {
  title: string;
  items: Notification[];
  deleted: string[];
  onUndo: (id: string) => void;
  onDelete: (id: string) => void;
  onRead: (id: string) => void;
  focusOffset: number;
  focusIndex: number;
}) {
  return (
    <div>
      <div className="sticky top-0 z-10 px-5 py-2 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        {title}
      </div>
      {items.map((n, i) => (
        <NotificationRow
          key={n.id}
          notification={n}
          deleted={deleted.includes(n.id)}
          onUndo={() => onUndo(n.id)}
          onDelete={() => onDelete(n.id)}
          onRead={() => onRead(n.id)}
          isFocused={focusIndex === focusOffset + i}
        />
      ))}
    </div>
  );
}

function NotificationRow({
  notification,
  deleted,
  onUndo,
  onDelete,
  onRead,
  isFocused,
}: {
  notification: Notification;
  deleted: boolean;
  onUndo: () => void;
  onDelete: () => void;
  onRead: () => void;
  isFocused: boolean;
}) {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    if (deleted) setExit(true);
  }, [deleted]);

  const row = (
    <div
      role="listitem"
      tabIndex={isFocused ? 0 : -1}
      aria-label={`${notification.title} – ${notification.message}`}
      className={cn(
        'p-5 transition-all duration-200 border-b border-gray-200 dark:border-gray-700 relative',
        getNotificationBgColor(notification.type, notification.read),
        'hover:shadow-sm',
        exit && 'scale-95 opacity-0 -translate-x-4'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                  {notification.title}
                </h4>
                {!notification.read && (
                  <Badge className="bg-[#4169E1] hover:bg-[#4169E1] text-white text-xs px-2 py-0.5">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRead}
                  className="h-9 w-9 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Mark as read"
                  aria-label="Mark as read"
                >
                  <Check className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-9 w-9 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400"
                title="Delete"
                aria-label="Delete"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* undo toast */}
      {deleted && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center gap-2 animate-in fade-in">
          <Button
            size="sm"
            variant="outline"
            onClick={onUndo}
            className="rounded-xl gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Undo
          </Button>
        </div>
      )}
    </div>
  );

  return deleted ? <div className="overflow-hidden">{row}</div> : row;
}