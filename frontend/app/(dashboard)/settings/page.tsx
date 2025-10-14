'use client';

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
  Info
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { addNotification } = useNotifications();
  const { user, logout } = useAuth();
  
  const [hasPassword, setHasPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check if user has password
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/auth/has-password`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHasPassword(data.hasPassword);
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
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user?.email]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setIsChangingPassword(true);

    // Validation
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      setIsChangingPassword(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      setIsChangingPassword(false);
      return;
    }

    if (hasPassword && !currentPassword) {
      setPasswordError('Please enter your current password');
      setIsChangingPassword(false);
      return;
    }

    if (hasPassword && currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      setIsChangingPassword(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = hasPassword 
        ? `${API_URL}/api/auth/change-password`
        : `${API_URL}/api/auth/set-password`;

      const body = hasPassword 
        ? { oldPassword: currentPassword, newPassword }
        : { password: newPassword };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${hasPassword ? 'change' : 'set'} password`);
      }

      const successMessage = hasPassword 
        ? 'Password changed successfully!'
        : 'Password set successfully! You can now login with email and password.';

      setPasswordSuccess(successMessage);
      
      addNotification(
        'auth_status',
        hasPassword ? 'Password Changed' : 'Password Set',
        successMessage,
        undefined,
        { action: hasPassword ? 'password_changed' : 'password_set' }
      );

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      // Update hasPassword state if it was a first-time set
      if (!hasPassword) {
        setHasPassword(true);
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setPasswordSuccess('');
      }, 5000);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to change password';
      setPasswordError(errorMessage);
      
      addNotification(
        'auth_status',
        'Password Change Failed',
        errorMessage,
        undefined,
        { action: 'password_error' }
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      logout();
    }
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
    
    // Store preferences per user
    const userEmail = user?.email;
    if (userEmail) {
      const prefsKey = `notification_preferences_${userEmail}`;
      localStorage.setItem(prefsKey, JSON.stringify(prefs));
    }
    
    // Show specific notification based on which preference changed
    const notificationMessages: { [key: string]: { title: string; message: string } } = {
      emailNotifications: {
        title: 'Email Notifications',
        message: value ? 'Email notifications have been enabled' : 'Email notifications have been disabled'
      },
      pushNotifications: {
        title: 'Push Notifications',
        message: value ? 'Push notifications have been enabled' : 'Push notifications have been disabled'
      },
      taskReminders: {
        title: 'Task Reminders',
        message: value ? 'Task reminders have been enabled' : 'Task reminders have been disabled'
      },
      deadlineAlerts: {
        title: 'Deadline Alerts',
        message: value ? 'Deadline alerts have been enabled' : 'Deadline alerts have been disabled'
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
              {/* Profile Info */}
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

        {/* Security Section - Password Change */}
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
                  {hasPassword ? 'Change Password' : 'Set Password'}
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

              {/* Info message for Google users without password */}
              {isGoogleUser && !hasPassword && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Google Account - Password Required
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        You signed in with Google. Set a password to enable email/password login as an alternative to Google Sign-In.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-5">
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
                        className="pr-10 h-11 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 rounded-xl border-2 focus:border-[#4169E1] dark:focus:border-[#4169E1]"
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
                      placeholder={hasPassword ? 'Enter new password' : 'Enter password (min. 6 characters)'}
                      className="pr-10 h-11 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 rounded-xl border-2 focus:border-[#4169E1] dark:focus:border-[#4169E1]"
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    Must be at least 6 characters
                  </p>
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
                      className="pr-10 h-11 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 rounded-xl border-2 focus:border-[#4169E1] dark:focus:border-[#4169E1]"
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

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#4169E1] hover:bg-[#3558CC] rounded-xl text-base font-semibold shadow-sm hover:shadow-md transition-all"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {hasPassword ? 'Changing Password...' : 'Setting Password...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      {hasPassword ? 'Change Password' : 'Set Password'}
                    </span>
                  )}
                </Button>
              </form>
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
                    onCheckedChange={(checked : boolean) => {
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
                    onCheckedChange={(checked : boolean) => {
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
    </div>
  );
}