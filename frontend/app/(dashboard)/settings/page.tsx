'use client';
import { archiveApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  User,
  Mail,
  Key,
  Bell,
  Moon,
  Sun,
  LogOut,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Info,
  Check,
  X,
  Archive,
  RotateCcw,
  Calendar,
  Folder
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Password validation function
const validatePassword = (password: string) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noSpaces: !/\s/.test(password),
  };
  const allValid = Object.values(requirements).every(Boolean);
  return { requirements, allValid };
};

interface ArchivedTask {
  id: string;
  title: string;
  description?: string;
  deletedAt: string;
  expiresAt: string;
  priority: 'low' | 'medium' | 'high';
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { addNotification } = useNotifications();
  const { user, logout } = useAuth();
  const [hasPassword, setHasPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isGoogleUser = user?.authProvider === 'google';

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);

  // Archive
  const [archivedTasks, setArchivedTasks] = useState<ArchivedTask[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string } | null>(null);

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmNewPassword && confirmNewPassword.length > 0;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check if user has password
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }
        const response = await fetch(`${API_URL}/api/auth/has-password`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Has password response:', data);
          setHasPassword(data.hasPassword);
        } else {
          console.error('Failed to check if user has password:', response.status, response.statusText);
          try {
            const errorData = await response.json();
            console.error('Error details:', errorData);
          } catch (e) {
            console.error('Could not parse error response:', e);
          }
        }
        // Load notification preferences - store per user
        const userEmail = user?.email;
        if (userEmail) {
          const prefsKey = `notification_preferences_${userEmail}`;
          const savedPrefs = localStorage.getItem(prefsKey);
          if (savedPrefs) {
            const prefs = JSON.parse(savedPrefs);
            setEmailNotifications(prefs.emailNotifications ?? true);
            setPushNotifications(prefs.pushNotifications ?? true);
            setTaskReminders(prefs.taskReminders ?? true);
            setDeadlineAlerts(prefs.deadlineAlerts ?? true);
          }
        }
        // Load archived tasks
        loadArchivedTasks();
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, [user?.email]);

  const loadArchivedTasks = async () => {
    try {
      setIsLoadingArchive(true);
      const data = await archiveApi.getArchived();
      setArchivedTasks(data);
    } catch (error) {
      console.error('Failed to load archived tasks:', error);
      addNotification(
        'error',
        'Load Failed',
        'Failed to load archived tasks.',
        undefined,
        { action: 'load_archive_failed' }
      );
    } finally {
      setIsLoadingArchive(false);
    }
  };

  const handleRestoreTask = async (taskId: string, taskTitle: string) => {
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

      loadArchivedTasks();
      setShowRestoreDialog(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to restore task:', error);
      addNotification(
        'error',
        'Restore Failed',
        'Failed to restore task. Please try again.',
        undefined,
        { action: 'restore_failed' }
      );
      setShowRestoreDialog(false);
      setSelectedTask(null);
    }
  };

  const handlePermanentlyDelete = async (taskId: string, taskTitle: string) => {
    setSelectedTask({ id: taskId, title: taskTitle });
    setShowDeleteDialog(true);
  };

  const confirmPermanentlyDelete = async () => {
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

      loadArchivedTasks();
      setShowDeleteDialog(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
      addNotification(
        'error',
        'Delete Failed',
        'Failed to delete task. Please try again.',
        undefined,
        { action: 'delete_failed' }
      );
      setShowDeleteDialog(false);
      setSelectedTask(null);
    }
  };

  const handleClearAllArchived = async () => {
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
      setShowClearAllDialog(false);
    } catch (error) {
      console.error('Failed to clear archive:', error);
      addNotification(
        'error',
        'Clear Failed',
        'Failed to clear archive. Please try again.',
        undefined,
        { action: 'clear_failed' }
      );
      setShowClearAllDialog(false);
    }
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    console.log('🎯 Step 1: Form submitted');
    console.log('🎯 Step 2: Current values:', {
      newPassword: newPassword ? `${newPassword.length} chars` : 'EMPTY',
      confirmNewPassword: confirmNewPassword ? `${confirmNewPassword.length} chars` : 'EMPTY',
      currentPassword: currentPassword ? `${currentPassword.length} chars` : 'EMPTY',
    });

    // Check that passwords are actually filled in
    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      console.log('❌ Step 3: Validation failed - empty passwords');
      setPasswordError('Password is required');
      addNotification(
        'password_change_failed',
        'Password Required',
        'Please enter a password.',
        undefined,
        { action: 'password_empty' }
      );
      return;
    }

    console.log('✅ Step 3: Passwords not empty');

    // Validation - Check all password requirements
    if (!passwordValidation.allValid) {
      console.log('❌ Step 4: Validation failed - requirements not met');
      setPasswordError('Password does not meet all requirements');
      setShowPasswordRequirements(true);
      addNotification(
        'password_change_failed',
        'Invalid Password',
        'Please ensure your password meets all the requirements.',
        undefined,
        { action: 'password_validation_failed' }
      );
      return;
    }

    console.log('✅ Step 4: Password requirements met');

    if (newPassword !== confirmNewPassword) {
      console.log('❌ Step 5: Passwords do not match');
      setPasswordError('New passwords do not match');
      addNotification(
        'password_change_failed',
        'Passwords Do Not Match',
        'Please make sure both password fields are identical.',
        undefined,
        { action: 'password_mismatch' }
      );
      return;
    }

    console.log('✅ Step 5: Passwords match');

    if (hasPassword && !currentPassword.trim()) {
      console.log('❌ Step 6: Current password required but missing');
      setPasswordError('Please enter your current password');
      addNotification(
        'password_change_failed',
        'Current Password Required',
        'Please enter your current password.',
        undefined,
        { action: 'current_password_required' }
      );
      return;
    }

    console.log('✅ Step 6: All validations passed');

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Step 7: Token:', token ? 'EXISTS' : 'MISSING');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const endpoint = hasPassword
        ? `${API_URL}/api/auth/change-password`
        : `${API_URL}/api/auth/set-password`;

      console.log('🎯 Step 8: Endpoint:', endpoint);
      console.log('🎯 Step 8: hasPassword:', hasPassword);

      // Construct the body with proper field names
      const requestBody = hasPassword
        ? {
            currentPassword: currentPassword.trim(),
            newPassword: newPassword.trim(),
            newPasswordConfirm: confirmNewPassword.trim()
          }
        : {
            password: newPassword.trim(),
            passwordConfirm: confirmNewPassword.trim()
          };

      console.log('📦 Step 9: Request body constructed:', {
        keys: Object.keys(requestBody),
        values: Object.entries(requestBody).map(([key, val]) => 
          `${key}: ${val.length} chars`
        )
      });

      const bodyString = JSON.stringify(requestBody);
      console.log('📦 Step 10: Stringified body:', bodyString);
      console.log('📦 Step 10: Body length:', bodyString.length);

      console.log('🌐 Step 11: About to fetch...');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: bodyString,
      });

      console.log('📥 Step 12: Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
      });

      const responseText = await response.text();
      console.log('📥 Step 13: Raw response text:', responseText);

      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
          console.log('📥 Step 14: Parsed response data:', data);
        } catch (parseError) {
          console.error('❌ Step 14: Failed to parse response:', parseError);
          data = { message: 'Invalid server response' };
        }
      } else {
        console.log('📥 Step 14: Empty response body');
      }

      if (!response.ok) {
        console.log('❌ Step 15: Response not OK, status:', response.status);
        // For error responses, use the error data from the response
        const errorData = typeof data === 'object' && data !== null ? data : { message: response.statusText };
        throw errorData;
      }

      console.log('✅ Step 16: Success!');

      const successMessage = hasPassword
        ? 'Password changed successfully! 🎉'
        : 'Password set successfully! You can now login with email and password. 🎉';

      setPasswordSuccess(successMessage);
      addNotification(
        'password_changed',
        hasPassword ? 'Password Changed ✓' : 'Password Set ✓',
        successMessage,
        undefined,
        { action: hasPassword ? 'password_changed' : 'password_set' }
      );

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordRequirements(false);

      // Update hasPassword state if it was a first-time set
      if (!hasPassword) {
        setHasPassword(true);
      }

      // Close form after 2 seconds
      setTimeout(() => {
        setPasswordSuccess('');
        setShowPasswordForm(false);
      }, 2000);
    } catch (err: any) {
      console.error('❌ Final error object:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error keys:', Object.keys(err || {}));
      
      // Handle different types of errors
      let backendError = 'An error occurred while changing your password';
      
      if (err && typeof err === 'object') {
        // If it's an error response from our API
        if (err.message) {
          backendError = err.message;
        } else if (err.error) {
          backendError = err.error;
        } else if (err.statusCode) {
          // Handle standard API error response
          backendError = err.message || `Error ${err.statusCode}: Request failed`;
        }
        // Rate limiting error with lockedUntil
        else if (err.statusCode && err.lockedUntil) {
          const lockedUntil = new Date(err.lockedUntil).toLocaleString();
          backendError = `Rate limit exceeded. Please try again after ${lockedUntil}. ${err.message || ''}`.trim();
        }
        // If error is the complete response data
        else if (Object.keys(err).length > 0) {
          backendError = err.message || err.error || JSON.stringify(err);
        } else if (JSON.stringify(err) === '{}') {
          // If we get an empty object, provide a meaningful default error
          backendError = 'Request failed: Server returned an incomplete response. The password change may have failed due to validation errors.';
        }
      } else if (typeof err === 'string') {
        backendError = err;
      } else if (err === undefined || err === null) {
        backendError = 'Request failed: No response from server. Please check your connection and try again.';
      }
      
      // Fallback to generic message if still empty
      if (!backendError || backendError === 'An error occurred while changing your password' || JSON.stringify(err) === '{}') {
        backendError = 'Failed to change password. Please try again or contact support if the problem persists.';
      }
      
      setPasswordError(backendError);
      addNotification(
        'password_change_failed',
        'Password Change Failed ❌',
        backendError,
        undefined,
        { action: 'password_error' }
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

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

  const saveNotificationPreferences = (key: string, value: boolean) => {
    const prefs = {
      emailNotifications,
      pushNotifications,
      taskReminders,
      deadlineAlerts,
      [key]: value
    };
    const userEmail = user?.email;
    if (userEmail) {
      const prefsKey = `notification_preferences_${userEmail}`;
      localStorage.setItem(prefsKey, JSON.stringify(prefs));
    }
    const notificationMessages: { [key: string]: { title: string; message: string } } = {
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
        <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-[#4169E1]" />
              Account
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-[#4169E1] to-[#3558CC] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user?.name || 'User'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user?.email || 'user@example.com'}
                    </p>
                    {isGoogleUser && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                        Signed in with Google
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Archive Section */}
        <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-[#4169E1]" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Task Archive
                </h2>
                {archivedTasks.length > 0 && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                    {archivedTasks.length} {archivedTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                )}
              </div>
              {archivedTasks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowArchive(!showArchive)}
                  className="rounded-xl"
                >
                  {showArchive ? 'Hide' : 'Show'} Archive
                </Button>
              )}
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Deleted Tasks Storage
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Deleted tasks are stored here for 30 days before being permanently removed. You can restore them anytime within this period.
                  </p>
                </div>
              </div>
            </div>
            {showArchive && (
              <div className="space-y-3">
                {isLoadingArchive ? (
                  <div className="text-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading archive...</p>
                  </div>
                ) : archivedTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Folder className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No archived tasks</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Deleted tasks will appear here for 30 days
                    </p>
                  </div>
                ) : (
                  <>
                    {archivedTasks.map((task) => {
                      const daysRemaining = getDaysRemaining(task.expiresAt);
                      return (
                        <div
                          key={task.id}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  task.priority === 'high'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    : task.priority === 'medium'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                }`}>
                                  {task.priority}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestoreTask(task.id, task.title)}
                                className="rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-800"
                                title="Restore task"
                              >
                                <RotateCcw className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePermanentlyDelete(task.id, task.title)}
                                className="rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800"
                                title="Delete permanently"
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {archivedTasks.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={handleClearAllArchived}
                        className="w-full mt-4 rounded-xl text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All Archived Tasks
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Security Section - Password Management */}
        <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#4169E1]" />
              Security
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Password Management
                </h3>
                {hasPassword ? (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full">
                    Not Set
                  </span>
                )}
              </div>

              {/* Action Buttons - Set Password / Change Password */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Set Password Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!hasPassword) {
                      setShowPasswordForm(true);
                      setPasswordError('');
                      setPasswordSuccess('');
                    }
                  }}
                  disabled={hasPassword}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    !hasPassword
                      ? 'border-[#4169E1] bg-[#4169E1]/5 dark:bg-[#4169E1]/10 hover:bg-[#4169E1]/10 dark:hover:bg-[#4169E1]/20 cursor-pointer'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      !hasPassword
                        ? 'bg-[#4169E1] text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                    }`}>
                      <Key className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h4 className={`font-semibold ${
                        !hasPassword
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-600'
                      }`}>
                        Set Password
                      </h4>
                      <p className={`text-xs ${
                        !hasPassword
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        Create new password
                      </p>
                    </div>
                  </div>
                </button>

                {/* Change Password Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (hasPassword) {
                      setShowPasswordForm(true);
                      setPasswordError('');
                      setPasswordSuccess('');
                    }
                  }}
                  disabled={!hasPassword}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    hasPassword
                      ? 'border-purple-500 bg-purple-500/5 dark:bg-purple-500/10 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 cursor-pointer'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      hasPassword
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                    }`}>
                      <Key className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h4 className={`font-semibold ${
                        hasPassword
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-600'
                      }`}>
                        Change Password
                      </h4>
                      <p className={`text-xs ${
                        hasPassword
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        Update existing password
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Info message for Google users without password */}
              {isGoogleUser && !hasPassword && !showPasswordForm && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Google Account - Password Optional
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        You signed in with Google. Set a password to enable email/password login as an alternative to Google Sign-In.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Form - Only shown when showPasswordForm is true */}
              {showPasswordForm && (
              <form onSubmit={handlePasswordChange} className="space-y-5 p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                {/* Current Password - Only show if user has password */}
                {hasPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="pr-10 h-11 dark:bg-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 rounded-xl border-2 focus:border-[#4169E1] dark:focus:border-[#4169E1]"
                        required={hasPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {hasPassword ? 'New Password' : 'Password'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setShowPasswordRequirements(true)}
                      placeholder={hasPassword ? 'Enter new password' : 'Create a strong password'}
                      className="pr-10 h-11 dark:bg-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 rounded-xl border-2 focus:border-[#4169E1] dark:focus:border-[#4169E1]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {/* Password Requirements */}
                  {showPasswordRequirements && newPassword.length > 0 && (
                    <div className="mt-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 space-y-2">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Password Requirements:
                      </p>
                      <div className="space-y-1.5">
                        {[
                          { valid: passwordValidation.requirements.minLength, text: 'Minimum of 8 characters' },
                          { valid: passwordValidation.requirements.hasUppercase, text: 'At least one uppercase letter (A–Z)' },
                          { valid: passwordValidation.requirements.hasLowercase, text: 'At least one lowercase letter (a–z)' },
                          { valid: passwordValidation.requirements.hasNumber, text: 'At least one number (0–9)' },
                          { valid: passwordValidation.requirements.hasSpecial, text: 'At least one special symbol (! @ # $ % ^ & *)' },
                          { valid: passwordValidation.requirements.noSpaces, text: 'No spaces allowed' },
                        ].map((requirement, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {requirement.valid ? (
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            ) : (
                              <X className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                            )}
                            <span
                              className={`text-xs ${
                                requirement.valid
                                  ? 'text-green-700 dark:text-green-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {requirement.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Confirm {hasPassword ? 'New ' : ''}Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder={hasPassword ? 'Re-enter new password' : 'Re-enter password'}
                      className="pr-10 h-11 dark:bg-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 rounded-xl border-2 focus:border-[#4169E1] dark:focus:border-[#4169E1]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {/* Password Match Indicator */}
                  {confirmNewPassword.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      {passwordsMatch ? (
                        <>
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-green-700 dark:text-green-400">
                            Passwords match
                          </span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="text-xs text-red-600 dark:text-red-400">
                            Passwords do not match
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* Error Message */}
                {passwordError && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">{passwordError}</p>
                    </div>
                  </div>
                )}
                {/* Success Message */}
                {passwordSuccess && (
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">{passwordSuccess}</p>
                    </div>
                  </div>
                )}
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setPasswordError('');
                      setPasswordSuccess('');
                      setShowPasswordRequirements(false);
                    }}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-[#4169E1] hover:bg-[#3558CC] rounded-xl text-base font-semibold shadow-sm hover:shadow-md transition-all"
                    disabled={isChangingPassword || !passwordValidation.allValid || !passwordsMatch}
                  >
                    {isChangingPassword ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        {hasPassword ? 'Changing...' : 'Setting...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        {hasPassword ? 'Change Password' : 'Set Password'}
                      </span>
                    )}
                  </Button>
                </div>
              </form>
              )}
            </div>
          </div>
        </Card>

        {/* Appearance Section */}
        <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-[#4169E1]" />
              ) : (
                <Sun className="h-5 w-5 text-[#4169E1]" />
              )}
              Appearance
            </h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Dark Mode</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications Section */}
        <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#4169E1]" />
              Notifications
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={(checked: boolean) => {
                      setEmailNotifications(checked);
                      saveNotificationPreferences('emailNotifications', checked);
                    }}
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show desktop notifications
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={(checked: boolean) => {
                      setPushNotifications(checked);
                      saveNotificationPreferences('pushNotifications', checked);
                    }}
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Task Reminders</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get reminded about upcoming tasks
                    </p>
                  </div>
                  <Switch
                    checked={taskReminders}
                    onCheckedChange={(checked: boolean) => {
                      setTaskReminders(checked);
                      saveNotificationPreferences('taskReminders', checked);
                    }}
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Deadline Alerts</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Alert me about approaching deadlines
                    </p>
                  </div>
                  <Switch
                    checked={deadlineAlerts}
                    onCheckedChange={(checked: boolean) => {
                      setDeadlineAlerts(checked);
                      saveNotificationPreferences('deadlineAlerts', checked);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="rounded-2xl bg-white dark:bg-gray-900 border-2 border-red-200 dark:border-red-900">
          <div className="p-6">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
              Danger Zone
            </h2>
            <div className="space-y-4">
              {/* Logout */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Log Out</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sign out of your account
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                  >
                    Log Out
                  </Button>
                </div>
              </div>
              {/* Delete Account */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <h4 className="font-medium text-red-600 dark:text-red-400">
                        Delete Account
                      </h4>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80">
                        Permanently delete your account and all data
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 rounded-xl"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* App Info */}
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
          <p>Quanby Task Manager v1.0.0</p>
          <p className="mt-1">© 2025 All rights reserved</p>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Confirm Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to logout? You will need to sign in again to access your tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLogout}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            >
              Yes, Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Task Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-green-600 dark:text-green-400" />
              Restore Task
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to restore <span className="font-semibold text-gray-900 dark:text-gray-100">"{selectedTask?.title}"</span>?
              <br /><br />
              This will move the task back to your active task list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowRestoreDialog(false);
                setSelectedTask(null);
              }}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestoreTask}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
            >
              Yes, Restore Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-2 border-red-300 dark:border-red-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Permanent Delete Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-900 dark:text-gray-100">"{selectedTask?.title}"</span>?
              <br />
              <span className="inline-block mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <span className="block text-sm text-red-700 dark:text-red-300 font-medium">
                  ⚠️ This action CANNOT be undone!
                </span>
                <span className="block text-sm text-red-600 dark:text-red-400 mt-1">
                  The task will be removed forever and cannot be recovered.
                </span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedTask(null);
              }}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPermanentlyDelete}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            >
              Yes, Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Archive Confirmation Dialog */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-2 border-red-300 dark:border-red-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Clear All Archived Tasks
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-900 dark:text-gray-100">ALL {archivedTasks.length} archived {archivedTasks.length === 1 ? 'task' : 'tasks'}</span>?
              <br />
              <span className="inline-block mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <span className="block text-sm text-red-700 dark:text-red-300 font-medium">
                  ⚠️ This action CANNOT be undone!
                </span>
                <span className="block text-sm text-red-600 dark:text-red-400 mt-1">
                  All archived tasks will be removed forever and cannot be recovered.
                </span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowClearAllDialog(false)}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearAll}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            >
              Yes, Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}