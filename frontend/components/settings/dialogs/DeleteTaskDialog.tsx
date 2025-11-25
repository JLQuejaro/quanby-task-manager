import { AlertCircle } from 'lucide-react';
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

interface DeleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  taskTitle: string | null;
}

export function DeleteTaskDialog({ open, onOpenChange, onConfirm, taskTitle }: DeleteTaskDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-gray-900 border-2 border-red-300 dark:border-red-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Permanent Delete Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
            Are you sure you want to permanently delete <span className="font-semibold text-gray-900 dark:text-gray-100">"{taskTitle}"</span>?
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
          <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
          >
            Yes, Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
