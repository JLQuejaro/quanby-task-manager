'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  LogOut,
  Keyboard,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
import { KeyboardShortcutsDialog } from '@/components/shared/KeyboardShortcutsDialog';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <div className="flex h-screen w-64 flex-col border-r bg-white dark:bg-gray-900 dark:border-gray-800">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b dark:border-gray-800 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4169E1]">
            <CheckSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Quanby</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Task Manager</p>
          </div>
        </div>

        {/* User Info */}
        <div className="border-b dark:border-gray-800 px-6 py-4">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#4169E1]/10 text-[#4169E1] dark:bg-[#4169E1]/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Keyboard Shortcuts Section */}
        <div className="border-t dark:border-gray-800 px-3 py-4">
          <div className="flex items-center justify-between mb-2 px-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              KEYBOARD SHORTCUTS
            </h3>
            <button
              onClick={() => setShowShortcuts(true)}
              className="text-[#4169E1] hover:text-[#3558CC] transition-colors"
              title="View all shortcuts"
            >
              <Keyboard className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <span>New Task</span>
              <kbd className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 font-mono border border-gray-300 dark:border-gray-700">
                N
              </kbd>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <span>Search</span>
              <kbd className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 font-mono border border-gray-300 dark:border-gray-700">
                /
              </kbd>
            </div>
            <button
              onClick={() => setShowShortcuts(true)}
              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-[#4169E1] font-medium"
            >
              View all shortcuts →
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="border-t dark:border-gray-800 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
            onClick={handleLogoutClick}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

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
    </>
  );
}