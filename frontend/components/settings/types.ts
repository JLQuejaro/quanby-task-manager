// components/settings/types.ts

export interface ArchivedTask {
  id: string;
  title: string;
  description?: string;
  deletedAt: string;
  expiresAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PasswordValidation {
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    noSpaces: boolean;
  };
  allValid: boolean;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
  deadlineAlerts: boolean;
}