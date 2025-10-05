'use client';

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

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <CheckSquare className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Quanby</h1>
          <p className="text-xs text-gray-500">Task Manager</p>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b px-6 py-4">
        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
        <p className="text-xs text-gray-500">{user?.email}</p>
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
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Keyboard Shortcuts */}
      <div className="border-t px-6 py-4">
        <h3 className="mb-2 text-xs font-semibold text-gray-500">
          KEYBOARD SHORTCUTS
        </h3>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>New Task</span>
            <kbd className="rounded bg-gray-100 px-2 py-1 font-mono">N</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Search</span>
            <kbd className="rounded bg-gray-100 px-2 py-1 font-mono">/</kbd>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700"
          onClick={logout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}