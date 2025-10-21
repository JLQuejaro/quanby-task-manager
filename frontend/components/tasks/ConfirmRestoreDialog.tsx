// src/components/tasks/ConfirmRestoreDialog.tsx
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
import { RefreshCw } from 'lucide-react';

interface ConfirmRestoreDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

/**
 * ConfirmRestoreDialog Component
 * 
 * Displays a confirmation dialog when user wants to restore a task from trash.
 * 
 * Workflow:
 * 1. User clicks "Restore" button on a trashed task
 * 2. This dialog appears asking for confirmation
 * 3. If confirmed, task is moved back to active state (isDeleted = false)
 * 4. If cancelled, task remains in trash
 * 
 * @param open - Controls dialog visibility
 * @param onClose - Called when dialog should close (cancel)
 * @param onConfirm - Called when user confirms restoration
 * @param taskTitle - Title of task being restored (for display)
 */
export const ConfirmRestoreDialog = ({
  open,
  onClose,
  onConfirm,
  taskTitle,
}: ConfirmRestoreDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <RefreshCw className="w-5 h-5 text-green-600 dark:text-green-500" />
            Restore Task
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Are you sure you want to restore this task?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {taskTitle}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            This task will be moved back to your active tasks list.
          </p>
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
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restore Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};