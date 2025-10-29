export type NotificationType = 
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_completed'
  | 'deadline_reminder'
  | 'overdue_alert'
  | 'auth_status'
  | 'password_changed'
  | 'password_change_failed'
  | 'auth_conflict'
  | 'verification_required'
  | 'auth_success'
  | 'auth_error'
  | 'verification_resent'
  | 'resend_failed'
  | 'task_restored'    
  | 'archive_cleared'   
  | 'error';   

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
  },
  {
    type: 'password_changed',
    trigger: 'After password change',
    channel: ['toast', 'in_app'],
    purpose: 'Confirms password update'
  },
  {
    type: 'password_change_failed',
    trigger: 'Password change error',
    channel: ['toast'],
    purpose: 'Error feedback'
  },
  {
    type: 'auth_conflict',
    trigger: 'OAuth email conflict',
    channel: ['toast'],
    purpose: 'Account conflict warning'
  },
  {
    type: 'verification_required',
    trigger: 'Email verification needed',
    channel: ['toast', 'in_app'],
    purpose: 'Email verification prompt'
  },
  {
    type: 'auth_success',
    trigger: 'Successful authentication',
    channel: ['toast'],
    purpose: 'Success confirmation'
  },
  {
    type: 'auth_error',
    trigger: 'Authentication error',
    channel: ['toast'],
    purpose: 'Error feedback'
  },
  {
    type: 'verification_resent',
    trigger: 'Verification email resent',
    channel: ['toast'],
    purpose: 'Confirmation message'
  },
  {
    type: 'resend_failed',
    trigger: 'Resend verification failed',
    channel: ['toast'],
    purpose: 'Error feedback'
  }
];