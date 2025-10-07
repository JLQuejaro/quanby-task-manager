'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Command } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Task Management',
      shortcuts: [
        { keys: ['N'], description: 'New Task' },
        { keys: ['E'], description: 'Edit Task' },
        { keys: ['Delete'], description: 'Delete Task' },
        { keys: ['Space'], description: 'Toggle Complete' },
      ],
    },
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['Ctrl', 'D'], description: 'Dashboard' },
        { keys: ['Ctrl', 'T'], description: 'Tasks' },
        { keys: ['Ctrl', 'P'], description: 'Profile' },
        { keys: ['Ctrl', ','], description: 'Settings' },
      ],
    },
    {
      title: 'Search & Filters',
      shortcuts: [
        { keys: ['/'], description: 'Search' },
        { keys: ['Ctrl', '1'], description: 'All Tasks' },
        { keys: ['Ctrl', '2'], description: 'Today' },
        { keys: ['Ctrl', '3'], description: 'Tomorrow' },
        { keys: ['Ctrl', '4'], description: 'Upcoming' },
        { keys: ['Ctrl', '5'], description: 'Completed' },
      ],
    },
    {
      title: 'Calendar Navigation',
      shortcuts: [
        { keys: ['←'], description: 'Previous Month' },
        { keys: ['→'], description: 'Next Month' },
        { keys: ['T'], description: 'Go to Today' },
      ],
    },
    {
      title: 'Priority',
      shortcuts: [
        { keys: ['Shift', 'H'], description: 'High Priority' },
        { keys: ['Shift', 'M'], description: 'Medium Priority' },
        { keys: ['Shift', 'L'], description: 'Low Priority' },
      ],
    },
    {
      title: 'View & Display',
      shortcuts: [
        { keys: ['Ctrl', 'K'], description: 'Toggle Theme' },
        { keys: ['Ctrl', 'R'], description: 'Refresh' },
        { keys: ['?'], description: 'Show Shortcuts' },
      ],
    },
    {
      title: 'Form Actions',
      shortcuts: [
        { keys: ['Ctrl', 'S'], description: 'Save' },
        { keys: ['Ctrl', 'Enter'], description: 'Submit' },
        { keys: ['Esc'], description: 'Cancel' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Command className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg shadow-sm">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-gray-400 text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg">Esc</kbd> or{' '}
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg">?</kbd> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}