// src/components/tasks/ConfirmPermanentDeleteDialog.tsx
'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmPermanentDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

/**
 * ConfirmPermanentDeleteDialog Component
 * 
 * Displays a confirmation dialog when user wants to permanently delete a task.
 * This is a critical action that cannot be undone.
 * 
 * Workflow:
 * 1. User clicks "Delete Forever" button on a trashed task
 * 2. This dialog appears with warning message
 * 3. If confirmed, task is permanently removed from database
 * 4. If cancelled, task remains in trash
 * 
 * Warning Level: HIGH - This action is irreversible
 * 
 * @param open - Controls dialog visibility
 * @param onClose - Called when dialog should close (cancel)
 * @param onConfirm - Called when user confirms permanent deletion
 * @param taskTitle - Title of task being deleted (for display)
 */
export const ConfirmPermanentDeleteDialog = ({
  open,
  onClose,
  onConfirm,
  taskTitle,
}: ConfirmPermanentDeleteDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-red-200 dark:border-red-900 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
            <AlertTriangle className="w-5 h-5" />
            Permanent Delete
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            This action cannot be undone. This will permanently delete the task.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 border border-red-200 dark:border-red-900">
            <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
              {taskTitle}
            </p>
            <p className="text-xs text-red-700 dark:text-red-400">
              ⚠️ This task will be permanently deleted and cannot be recovered.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-xl"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};