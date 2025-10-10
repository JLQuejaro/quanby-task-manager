export type NotificationType = 
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_completed'
  | 'deadline_reminder'
  | 'overdue_alert'
  | 'auth_status';

export type NotificationChannel = 'toast' | 'email' | 'in_app';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel[];
  read: boolean;
  createdAt: Date;
  taskId?: number;
  metadata?: Record<string, any>;
}

export interface NotificationConfig {
  type: NotificationType;
  trigger: string;
  channel: NotificationChannel[];
  purpose: string;
}

export const NOTIFICATION_CONFIGS: NotificationConfig[] = [
  {
    type: 'task_created',
    trigger: 'After successful creation',
    channel: ['toast', 'in_app'],
    purpose: 'Confirms success'
  },
  {
    type: 'task_updated',
    trigger: 'After edit/save',
    channel: ['toast', 'in_app'],
    purpose: 'Confirms update'
  },
  {
    type: 'task_deleted',
    trigger: 'After deletion',
    channel: ['toast', 'in_app'],
    purpose: 'Confirms removal'
  },
  {
    type: 'task_completed',
    trigger: 'On checkbox toggle',
    channel: ['toast', 'in_app'],
    purpose: 'Confirms completion'
  },
  {
    type: 'deadline_reminder',
    trigger: 'X hours/days before deadline',
    channel: ['toast', 'in_app', 'email'],
    purpose: 'Prevents missed tasks'
  },
  {
    type: 'overdue_alert',
    trigger: 'After deadline passes',
    channel: ['toast', 'in_app'],
    purpose: 'Tracks late tasks'
  },
  {
    type: 'auth_status',
    trigger: 'Login/Register/Logout',
    channel: ['toast', 'in_app'],
    purpose: 'Guides user session flow'
  }
];