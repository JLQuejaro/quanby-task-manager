'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, archiveApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

// Import all refactored components
import { AccountSection } from '@/components/settings/AccountSection';
import { ArchiveSection } from '@/components/settings/ArchiveSection';
import { SecuritySection } from '@/components/settings/SecuritySection';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';

// Import dialogs
import { LogoutDialog } from '@/components/settings/dialogs/LogoutDialog';
import { RestoreTaskDialog } from '@/components/settings/dialogs/RestoreTaskDialog';
import { DeleteTaskDialog } from '@/components/settings/dialogs/DeleteTaskDialog';
import { ClearArchiveDialog } from '@/components/settings/dialogs/ClearArchiveDialog';

// Import types
import { ArchivedTask, NotificationPreferences } from '@/components/settings/types';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { addNotification } = useNotifications();
  const { user, logout } = useAuth();

  // State
  const [hasPassword, setHasPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [archivedTasks, setArchivedTasks] = useState<ArchivedTask[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  
  // Dialog states
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string } | null>(null);

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    deadlineAlerts: true,
  });

  const isGoogleUser = user?.authProvider === 'google';

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, [user?.email]);

  const loadUserData = async () => {
    try {
      // Check if user has password
      const passwordStatus = await authApi.hasPassword();
      setHasPassword(passwordStatus.hasPassword);

      // Load notification preferences
      const userEmail = user?.email;
      if (userEmail) {
        const prefsKey = `notification_preferences_${userEmail}`;
        const savedPrefs = localStorage.getItem(prefsKey);
        if (savedPrefs) {
          setNotificationPrefs(JSON.parse(savedPrefs));
        }
      }

      // Load archived tasks
      await loadArchivedTasks();
    } catch (error) {
      console.error('Failed to load user data:', error);
      addNotification(
        'error',
        'Load Failed',
        'Failed to load user settings.',
        undefined,
        { action: 'load_settings_failed' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadArchivedTasks = async () => {
    try {
      setIsLoadingArchive(true);
      const data = await archiveApi.getArchived();
      setArchivedTasks(data);
    } catch (error) {
      console.error('Failed to load archived tasks:', error);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  // Password handlers
  const handlePasswordSubmit = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    if (hasPassword) {
      await authApi.changePassword(currentPassword, newPassword, confirmPassword);
      addNotification(
        'password_changed',
        'Password Changed ✓',
        'Password changed successfully! 🎉',
        undefined,
        { action: 'password_changed' }
      );
    } else {
      await authApi.setPassword(newPassword, confirmPassword);
      setHasPassword(true);
      if (user) {
        const updatedUser = { ...user, hasPassword: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      addNotification(
        'password_changed',
        'Password Set ✓',
        'Password set successfully! You can now login with email and password. 🎉',
        undefined,
        { action: 'password_set' }
      );
    }
  };

  // Archive handlers
  const handleRestoreTask = (taskId: string, taskTitle: string) => {
    setSelectedTask({ id: taskId, title: taskTitle });
    setShowRestoreDialog(true);
  };

  const confirmRestoreTask = async () => {
    if (!selectedTask) return;
    try {
      await archiveApi.restore(Number(selectedTask.id));
      addNotification(
        'task_restored',
        'Task Restored ✓',
        `"${selectedTask.title}" has been successfully restored to your task list.`,
        Number(selectedTask.id),
        { action: 'task_restored', taskId: selectedTask.id }
      );
      await loadArchivedTasks();
    } catch (error) {
      console.error('Failed to restore task:', error);
      addNotification(
        'error',
        'Restore Failed',
        'Failed to restore task. Please try again.',
        undefined,
        { action: 'restore_failed' }
      );
    } finally {
      setShowRestoreDialog(false);
      setSelectedTask(null);
    }
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    setSelectedTask({ id: taskId, title: taskTitle });
    setShowDeleteDialog(true);
  };

  const confirmDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await archiveApi.permanentlyDelete(Number(selectedTask.id));
      addNotification(
        'task_deleted',
        'Task Permanently Deleted',
        `"${selectedTask.title}" has been permanently removed from archive.`,
        Number(selectedTask.id),
        { action: 'permanent_delete', taskId: selectedTask.id }
      );
      await loadArchivedTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
      addNotification(
        'error',
        'Delete Failed',
        'Failed to delete task. Please try again.',
        undefined,
        { action: 'delete_failed' }
      );
    } finally {
      setShowDeleteDialog(false);
      setSelectedTask(null);
    }
  };

  const handleClearAll = () => {
    if (archivedTasks.length === 0) return;
    setShowClearAllDialog(true);
  };

  const confirmClearAll = async () => {
    const taskCount = archivedTasks.length;
    try {
      await archiveApi.clearAll();
      addNotification(
        'archive_cleared',
        'Archive Cleared',
        `All ${taskCount} archived ${taskCount === 1 ? 'task has' : 'tasks have'} been permanently deleted.`,
        undefined,
        { action: 'clear_archive', taskCount }
      );
      setArchivedTasks([]);
    } catch (error) {
      console.error('Failed to clear archive:', error);
      addNotification(
        'error',
        'Clear Failed',
        'Failed to clear archive. Please try again.',
        undefined,
        { action: 'clear_failed' }
      );
    } finally {
      setShowClearAllDialog(false);
    }
  };

  // Notification preference handler
  const handleNotificationPreferenceChange = (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);

    // Save to localStorage
    const userEmail = user?.email;
    if (userEmail) {
      const prefsKey = `notification_preferences_${userEmail}`;
      localStorage.setItem(prefsKey, JSON.stringify(newPrefs));
    }

    // Show notification
    const notificationMessages: Record<keyof NotificationPreferences, { title: string; message: string }> = {
      emailNotifications: {
        title: 'Email Notifications',
        message: value ? 'Email notifications have been enabled ✓' : 'Email notifications have been disabled'
      },
      pushNotifications: {
        title: 'Push Notifications',
        message: value ? 'Push notifications have been enabled ✓' : 'Push notifications have been disabled'
      },
      taskReminders: {
        title: 'Task Reminders',
        message: value ? 'Task reminders have been enabled ✓' : 'Task reminders have been disabled'
      },
      deadlineAlerts: {
        title: 'Deadline Alerts',
        message: value ? 'Deadline alerts have been enabled ✓' : 'Deadline alerts have been disabled'
      }
    };

    const notification = notificationMessages[key];
    addNotification(
      'task_updated',
      notification.title,
      notification.message,
      undefined,
      { action: 'notification_preference_changed', preference: key, enabled: value }
    );
  };

  // Logout handler
  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  // Delete account handler
  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will permanently delete your account and all data. This action cannot be undone. Are you absolutely sure?'
    );
    if (confirmed) {
      const doubleConfirm = window.confirm(
        'This is your last chance. Click OK to confirm account deletion.'
      );
      if (doubleConfirm) {
        addNotification(
          'auth_status',
          'Account Deletion',
          'Account deletion is not yet implemented. Contact support for assistance.',
          undefined,
          { action: 'delete_account_requested' }
        );
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        <Header title="Settings" showSearch={false} />
        <div className="p-6 max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <Header title="Settings" showSearch={false} />
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Account Section */}
        <AccountSection user={user} />

        {/* Archive Section */}
        <ArchiveSection
          tasks={archivedTasks}
          isLoading={isLoadingArchive}
          onRestore={handleRestoreTask}
          onDelete={handleDeleteTask}
          onClearAll={handleClearAll}
        />

        {/* Security Section */}
        <SecuritySection
          hasPassword={hasPassword}
          isGoogleUser={isGoogleUser}
          onPasswordSubmit={handlePasswordSubmit}
        />

        {/* Appearance Section */}
        <AppearanceSection theme={theme} onToggleTheme={toggleTheme} />

        {/* Notifications Section */}
        <NotificationsSection
          preferences={notificationPrefs}
          onPreferenceChange={handleNotificationPreferenceChange}
        />

        {/* Danger Zone */}
        <DangerZoneSection
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />

        {/* App Info */}
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
          <p>Quanby Task Manager v1.0.0</p>
          <p className="mt-1">© 2025 All rights reserved</p>
        </div>
      </div>

      {/* Dialogs */}
      <LogoutDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={confirmLogout}
      />

      <RestoreTaskDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        onConfirm={confirmRestoreTask}
        taskTitle={selectedTask?.title || null}
      />

      <DeleteTaskDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteTask}
        taskTitle={selectedTask?.title || null}
      />

      <ClearArchiveDialog
        open={showClearAllDialog}
        onOpenChange={setShowClearAllDialog}
        onConfirm={confirmClearAll}
        taskCount={archivedTasks.length}
      />
    </div>
  );
}