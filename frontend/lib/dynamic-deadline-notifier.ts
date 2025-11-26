/**
 * Dynamic Task Deadline Notification System
 * 
 * This system intelligently manages notification frequency based on task urgency:
 * - 7+ days away: No automatic notifications (only manual reminders)
 * - 1-7 days away: Every 8 hours
 * - 6-24 hours away: Every 2.5 hours
 * - 1-6 hours away: Every 30 minutes
 * - Under 1 hour: Specific Milestones (60m, 45m, 30m, 20m, 10m, 5m, 3m, 2m, 1m)
 * 
 * Features:
 * - Cooldown periods prevent spam for long-term tasks
 * - Milestone-based tracking for urgent tasks
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
  lastMilestone?: number; // Track the last specific milestone notified (e.g., 30, 10, 5)
}

// Specific milestones for notifications (in minutes)
const URGENT_MILESTONES = [60, 45, 30, 20, 10, 5, 3, 2, 1];

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
    // Critical: Under 30 minutes (Handled by milestones, but keeping for structure)
    if (minutesUntilDue <= 30) {
      return {
        intervalMinutes: 0, // Milestone based
        displayDuration: 2500, // 2.5 seconds - critical but snappy
        urgencyLevel: 'critical'
      };
    }
    
    // High urgency: 30min - 2 hours
    if (minutesUntilDue <= 120) {
      return {
        intervalMinutes: 30, // Fixed: Was 0, causing spam for tasks due in 1-2 hours
        displayDuration: 2000, // 2 seconds
        urgencyLevel: 'high'
      };
    }
    
    // Medium urgency: 2-6 hours
    if (minutesUntilDue <= 360) {
      return {
        intervalMinutes: 30,
        displayDuration: 1500, // 1.5 seconds
        urgencyLevel: 'medium'
      };
    }
    
    // Low urgency: 6-24 hours
    if (minutesUntilDue <= 1440) {
      return {
        intervalMinutes: 150, // 2.5 hours
        displayDuration: 1500, // 1.5 seconds
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
      displayDuration: 1500,
      urgencyLevel: 'low'
    };
  }

  /**
   * Format the notification message based on time remaining
   */
  private formatMessage(minutesUntilDue: number, taskTitle: string): string {
    const minutes = Math.ceil(minutesUntilDue);
    
    if (minutes <= 1) {
      return `🔴 HURRY: "${taskTitle}" is due in less than 1 minute!`;
    }
    if (minutes <= 5) {
      return `🔴 URGENT: "${taskTitle}" is due in ${minutes} minutes!`;
    }
    if (minutes <= 30) {
      return `⚠️ "${taskTitle}" is due in ${minutes} minutes`;
    }
    if (minutes <= 60) {
      return `⏰ "${taskTitle}" is due in ${minutes} minutes`;
    }
    if (minutes <= 120) {
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
   * Call this method periodically (e.g., every 10-30 seconds) for each task
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

    // Handle overdue tasks
    if (minutesUntilDue < 0) {
      this.checkOverdueNotification(task, minutesUntilDue, now);
      return; 
    }

    // SPAM MODE: Notification every check if due in <= 10 minutes
    if (minutesUntilDue <= 10) {
        this.checkSpamNotification(task, minutesUntilDue, now);
        return;
    }

    // Logic for Urgent Tasks (<= 60 minutes)
    if (minutesUntilDue <= 60) {
        this.checkMilestoneNotification(task, minutesUntilDue, now);
        return;
    }

    // Logic for Standard Tasks (> 60 minutes)
    this.checkStandardNotification(task, minutesUntilDue, now);
  }

  private checkSpamNotification(task: Task, minutesUntilDue: number, now: number) {
    const lastRecord = this.lastNotifications.get(task.id);
    
    // Debounce: Ensure we don't spam faster than once every 5 seconds
    if (lastRecord && (now - lastRecord.lastNotifiedAt) < 5000) {
        return;
    }

    const message = this.formatMessage(minutesUntilDue, task.title);
    
    this.notifyCallback(
        'deadline_reminder', 
        'Deadline Imminent', 
        message, 
        task.id, 
        3000
    );
    
    this.lastNotifications.set(task.id, {
        taskId: task.id,
        lastNotifiedAt: now,
        urgencyLevel: 'critical',
        lastMilestone: Math.floor(minutesUntilDue)
    });
  }

  private checkMilestoneNotification(task: Task, minutesUntilDue: number, now: number) {
    // Find the applicable milestone (the largest milestone that we have passed or are at)
    // e.g., if 25 mins, applicable is 30 (if we want to notify "under 30") or 20 (next)?
    // User wants: 60, 45, 30...
    // If time is 55, we should have notified for 60.
    // If time is 25, we should have notified for 30.
    
    // We iterate to find the smallest milestone that is >= minutesUntilDue.
    // Wait, if we are at 25, we want to ensure we notified for 30.
    // But if we *just* crossed 30 (e.g. 29.9), we notify.
    // If we are way past 30 (e.g. 25), and haven't notified for 30, should we?
    // Yes, effectively catching up, but the message will say "Due in 25 mins".
    
    // Find the smallest milestone M such that minutesUntilDue <= M
    // Example: 59 mins. Milestones: ..., 60. M=60.
    // Example: 25 mins. Milestones: ..., 30, ... M=30.
    
    // We want to trigger if we haven't triggered for this M yet.
    
    let applicableMilestone = 0;
    // milestones are sorted descending: 60, 45, 30, ...
    // We want the smallest one that is >= minutesUntilDue.
    // Actually, we want to trigger for the *highest* priority milestone we've reached.
    // If minutesUntilDue is 25, we are "under 30". The milestone is 30.
    
    // Let's try: Find the first milestone (descending) where minutesUntilDue <= milestone.
    // e.g. 59 <= 60. Found 60.
    // e.g. 25 <= 30. Found 30.
    // e.g. 4 <= 5. Found 5.
    
    const milestone = URGENT_MILESTONES.find(m => minutesUntilDue <= m);
    
    if (!milestone) return; // Should not happen if < 60 and 60 is in milestones

    const lastRecord = this.lastNotifications.get(task.id);
    const lastMilestone = lastRecord?.lastMilestone || Infinity;

    // If we are in a new milestone bracket (e.g., dropped from >60 to <=60, or >30 to <=30)
    // We check if the current milestone is *smaller* than the last notified one.
    // e.g. Last notified was 60. Current is 45 (minutesUntilDue=44). 45 < 60. Notify.
    
    if (milestone < lastMilestone) {
        const urgencyLevel = minutesUntilDue <= 30 ? 'critical' : 'high';
        const message = this.formatMessage(minutesUntilDue, task.title);
        const type = this.getNotificationType(urgencyLevel);
        // Critical (<=10 mins): 2.5s, High: 2s
        const displayDuration = minutesUntilDue <= 10 ? 2500 : 2000;

        this.notifyCallback(type, 'Deadline Approaching', message, task.id, displayDuration);
        
        this.lastNotifications.set(task.id, {
            taskId: task.id,
            lastNotifiedAt: now,
            urgencyLevel,
            lastMilestone: milestone
        });
    }
  }

  private checkOverdueNotification(task: Task, minutesUntilDue: number, now: number) {
    // check if we have already notified that it is overdue
    // We use a special milestone '-1' or similar to indicate "Overdue" has been triggered.
    // Or we just check if urgencyLevel was 'critical' and now it's 'overdue'?
    
    // Let's use a distinct urgency level for the record: 'overdue_notified'
    
    const lastRecord = this.lastNotifications.get(task.id);
    
    // If we already marked it as overdue notified, don't spam (unless we want periodic reminders?)
    // For now, notify ONCE when it becomes overdue.
    if (lastRecord && lastRecord.urgencyLevel === 'overdue_notified') {
        return;
    }

    // Trigger the notification
    const message = `🔴 OVERDUE: "${task.title}" was due ${this.formatOverdueTime(Math.abs(minutesUntilDue))} ago!`;
    const type: NotificationType = 'overdue_alert';
    const displayDuration = 3000; // 3 seconds for the big "It's Overdue" alert

    this.notifyCallback(type, 'Task Overdue', message, task.id, displayDuration);
    
    this.lastNotifications.set(task.id, {
        taskId: task.id,
        lastNotifiedAt: now,
        urgencyLevel: 'overdue_notified',
        lastMilestone: -1
    });
  }

  private formatOverdueTime(minutes: number): string {
      if (minutes < 60) return `${Math.floor(minutes)} mins`;
      if (minutes < 1440) return `${(minutes / 60).toFixed(1)} hours`;
      return `${Math.floor(minutes / 1440)} days`;
  }

  private checkStandardNotification(task: Task, minutesUntilDue: number, now: number) {
    const timing = this.calculateNotificationTiming(minutesUntilDue);
    
    // Basic check if interval passed
    if (!this.shouldNotifyStandard(task.id, timing.intervalMinutes, timing.urgencyLevel, now)) {
      return;
    }

    const message = this.formatMessage(minutesUntilDue, task.title);
    const notificationType = this.getNotificationType(timing.urgencyLevel);

    this.notifyCallback(
      notificationType,
      'Task Deadline Reminder',
      message,
      task.id,
      timing.displayDuration
    );

    this.lastNotifications.set(task.id, {
      taskId: task.id,
      lastNotifiedAt: now,
      urgencyLevel: timing.urgencyLevel,
      lastMilestone: Infinity // Reset milestone tracking if we go back to standard (e.g. date changed)
    });
  }

  private shouldNotifyStandard(taskId: number, requiredIntervalMinutes: number, currentUrgency: string, now: number): boolean {
    const lastRecord = this.lastNotifications.get(taskId);
    if (!lastRecord) return true;

    const minutesSinceLastNotification = (now - lastRecord.lastNotifiedAt) / (1000 * 60);
    const cooldownPassed = minutesSinceLastNotification >= requiredIntervalMinutes;
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