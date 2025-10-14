'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

/**
 * This component bridges AuthContext and NotificationContext
 * It syncs the authenticated user with the notification system
 */
export function AuthNotificationWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { setCurrentUserEmail } = useNotifications();

  // Sync user email whenever auth state changes
  useEffect(() => {
    if (user?.email) {
      setCurrentUserEmail(user.email);
    } else {
      setCurrentUserEmail(null);
    }
  }, [user?.email, setCurrentUserEmail]);

  return <>{children}</>;
}