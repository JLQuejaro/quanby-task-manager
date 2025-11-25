import { RotateCcw } from 'lucide-react';
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

interface RestoreTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  taskTitle: string | null;
}

export function RestoreTaskDialog({ open, onOpenChange, onConfirm, taskTitle }: RestoreTaskDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-green-600 dark:text-green-400" />
            Restore Task
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
            Are you sure you want to restore <span className="font-semibold text-gray-900 dark:text-gray-100">"{taskTitle}"</span>?
            <br /><br />
            This will move the task back to your active task list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
          >
            Yes, Restore Task
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

