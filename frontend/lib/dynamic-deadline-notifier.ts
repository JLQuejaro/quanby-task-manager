/**
 * Dynamic Task Deadline Notification System
 * 
 * This system intelligently manages notification frequency based on task urgency:
 * - 7+ days away: No automatic notifications (only manual reminders)
 * - 1-7 days away: Every 8 hours
 * - 6-24 hours away: Every 2.5 hours
 * - 2-6 hours away: Every 30 minutes
 * - 30min-2hrs away: Every 10 minutes
 * - Under 30min: Every 5 minutes (critical)
 * 
 * Features:
 * - Cooldown periods prevent spam
 * - Short display duration (1-3 seconds based on urgency)
 * - Tracks last notification time per task
 * - Only notifies for incomplete, upcoming tasks
 */

import { NotificationType } from './notification';

export interface Task {
  id: number;
  title: string;
  dueDate?: string; // ISO date string
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
}

interface NotificationTiming {
  intervalMinutes: number; // How often to notify
  displayDuration: number; // How long to show notification (ms)
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface LastNotificationRecord {
  taskId: number;
  lastNotifiedAt: number; // timestamp
  urgencyLevel: string;
}

export class DynamicDeadlineNotifier {
  // Store last notification times to prevent duplicates
  private lastNotifications: Map<number, LastNotificationRecord> = new Map();
  
  // Callback function to trigger notifications (connect to your NotificationContext)
  private notifyCallback: (
    type: NotificationType,
    title: string,
    message: string,
    taskId: number,
    displayDuration: number
  ) => void;

  constructor(
    notifyCallback: (
      type: NotificationType,
      title: string,
      message: string,
      taskId: number,
      displayDuration: number
    ) => void
  ) {
    this.notifyCallback = notifyCallback;
  }

  /**
   * Calculate notification timing based on time until deadline
   * Returns interval between notifications and display duration
   */
  private calculateNotificationTiming(minutesUntilDue: number): NotificationTiming {
    // Critical: Under 30 minutes
    if (minutesUntilDue <= 30) {
      return {
        intervalMinutes: 5,
        displayDuration: 3000, // 3 seconds - needs immediate attention
        urgencyLevel: 'critical'
      };
    }
    
    // High urgency: 30min - 2 hours
    if (minutesUntilDue <= 120) {
      return {
        intervalMinutes: 10,
        displayDuration: 2500, // 2.5 seconds
        urgencyLevel: 'high'
      };
    }
    
    // Medium urgency: 2-6 hours
    if (minutesUntilDue <= 360) {
      return {
        intervalMinutes: 30,
        displayDuration: 2000, // 2 seconds
        urgencyLevel: 'medium'
      };
    }
    
    // Low urgency: 6-24 hours
    if (minutesUntilDue <= 1440) {
      return {
        intervalMinutes: 150, // 2.5 hours
        displayDuration: 2000, // 2 seconds
        urgencyLevel: 'medium'
      };
    }
    
    // Very low urgency: 1-7 days
    if (minutesUntilDue <= 10080) {
      return {
        intervalMinutes: 480, // 8 hours
        displayDuration: 1500, // 1.5 seconds
        urgencyLevel: 'low'
      };
    }
    
    // No automatic notifications for tasks due in 7+ days
    return {
      intervalMinutes: Infinity,
      displayDuration: 1000,
      urgencyLevel: 'low'
    };
  }

  /**
   * Check if enough time has passed since last notification (cooldown check)
   * Prevents notification spam
   */
  private shouldNotify(taskId: number, requiredIntervalMinutes: number, currentUrgency: string): boolean {
    const lastRecord = this.lastNotifications.get(taskId);
    
    if (!lastRecord) {
      return true; // First notification for this task
    }

    const now = Date.now();
    const minutesSinceLastNotification = (now - lastRecord.lastNotifiedAt) / (1000 * 60);
    
    // Check if cooldown period has passed
    const cooldownPassed = minutesSinceLastNotification >= requiredIntervalMinutes;
    
    // Allow notification if urgency level increased (e.g., from medium to high)
    const urgencyIncreased = this.hasUrgencyIncreased(lastRecord.urgencyLevel, currentUrgency);
    
    return cooldownPassed || urgencyIncreased;
  }

  /**
   * Determine if urgency level has increased since last notification
   */
  private hasUrgencyIncreased(lastUrgency: string, currentUrgency: string): boolean {
    const urgencyLevels = ['low', 'medium', 'high', 'critical'];
    const lastIndex = urgencyLevels.indexOf(lastUrgency);
    const currentIndex = urgencyLevels.indexOf(currentUrgency);
    return currentIndex > lastIndex;
  }

  /**
   * Format the notification message based on time remaining
   */
  private formatMessage(minutesUntilDue: number, taskTitle: string): string {
    if (minutesUntilDue <= 5) {
      return `🔴 URGENT: "${taskTitle}" is due in ${Math.floor(minutesUntilDue)} minutes!`;
    }
    if (minutesUntilDue <= 30) {
      return `⚠️ "${taskTitle}" is due in ${Math.floor(minutesUntilDue)} minutes`;
    }
    if (minutesUntilDue <= 120) {
      const hours = (minutesUntilDue / 60).toFixed(1);
      return `⏰ "${taskTitle}" is due in ${hours} hours`;
    }
    if (minutesUntilDue <= 1440) {
      const hours = Math.floor(minutesUntilDue / 60);
      return `📅 "${taskTitle}" is due in ${hours} hours`;
    }
    const days = Math.floor(minutesUntilDue / 1440);
    return `📆 "${taskTitle}" is due in ${days} day${days > 1 ? 's' : ''}`;
  }

  /**
   * Get notification type based on urgency
   */
  private getNotificationType(urgencyLevel: string): NotificationType {
    switch (urgencyLevel) {
      case 'critical':
      case 'high':
        return 'overdue_alert';
      default:
        return 'deadline_reminder';
    }
  }

  /**
   * Main method: Check a task and send notification if needed
   * Call this method periodically (e.g., every 1-5 minutes) for each task
   */
  public checkAndNotify(task: Task): void {
    // Skip completed tasks
    if (task.completed) {
      return;
    }

    // Skip tasks without due dates
    if (!task.dueDate) {
      return;
    }

    const now = Date.now();
    const dueTime = new Date(task.dueDate).getTime();
    const minutesUntilDue = (dueTime - now) / (1000 * 60);

    // Skip overdue tasks (handle separately if needed)
    if (minutesUntilDue < 0) {
      return;
    }

    // Calculate timing parameters
    const timing = this.calculateNotificationTiming(minutesUntilDue);

    // Check cooldown period
    if (!this.shouldNotify(task.id, timing.intervalMinutes, timing.urgencyLevel)) {
      return; // Too soon since last notification
    }

    // Generate notification message
    const message = this.formatMessage(minutesUntilDue, task.title);
    const notificationType = this.getNotificationType(timing.urgencyLevel);

    // Send notification via callback
    this.notifyCallback(
      notificationType,
      'Task Deadline Reminder',
      message,
      task.id,
      timing.displayDuration
    );

    // Record this notification
    this.lastNotifications.set(task.id, {
      taskId: task.id,
      lastNotifiedAt: now,
      urgencyLevel: timing.urgencyLevel
    });
  }

  /**
   * Batch check multiple tasks
   * Call this from a periodic timer (e.g., setInterval every 1-5 minutes)
   */
  public checkMultipleTasks(tasks: Task[]): void {
    tasks.forEach(task => this.checkAndNotify(task));
  }

  /**
   * Clear notification history for a specific task
   * Call this when a task is completed or deleted
   */
  public clearTaskHistory(taskId: number): void {
    this.lastNotifications.delete(taskId);
  }

  /**
   * Clear all notification history
   * Useful when user logs out or resets
   */
  public clearAllHistory(): void {
    this.lastNotifications.clear();
  }

  /**
   * Get diagnostic info about notification state
   */
  public getNotificationStatus(taskId: number): LastNotificationRecord | null {
    return this.lastNotifications.get(taskId) || null;
  }
}
