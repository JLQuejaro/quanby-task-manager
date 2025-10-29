// src/components/tasks/TaskCard.tsx
'use client';
import { useState } from 'react';
import { Task } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { ConfirmUpdateDialog } from './ConfirmUpdateDialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isPast } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: number, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

const priorityConfig = {
  high: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'High' },
  medium: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Medium' },
  low: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Low' },
};

const TaskCard = ({ task, onToggleComplete, onEdit, onDelete }: TaskCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [pendingToggleState, setPendingToggleState] = useState<boolean | null>(null);

  /**
   * Handle Toggle Complete
   * 
   * Shows confirmation dialog before marking task as complete or reopening it.
   */
  const handleToggleComplete = (checked: boolean) => {
    setPendingToggleState(checked);
    if (checked) {
      // Marking as complete
      setShowCompleteDialog(true);
    } else {
      // Reopening task
      setShowReopenDialog(true);
    }
  };

  /**
   * Confirm Complete
   * 
   * Marks the task as completed after user confirmation.
   */
  const confirmComplete = () => {
    if (pendingToggleState !== null) {
      onToggleComplete(task.id, pendingToggleState);
      setPendingToggleState(null);
    }
    setShowCompleteDialog(false);
  };

  /**
   * Confirm Reopen
   * 
   * Reopens the task after user confirmation.
   */
  const confirmReopen = () => {
    if (pendingToggleState !== null) {
      onToggleComplete(task.id, pendingToggleState);
      setPendingToggleState(null);
    }
    setShowReopenDialog(false);
  };

  /**
   * Handle Edit Click
   * 
   * Opens confirmation dialog before allowing task edit.
   * This ensures users don't accidentally modify tasks.
   */
  const handleEdit = () => {
    setShowUpdateDialog(true);
  };

  /**
   * Confirm Update
   * 
   * Opens the edit form after user confirms they want to edit the task.
   */
  const confirmUpdate = () => {
    onEdit(task);
    setShowUpdateDialog(false);
  };

  /**
   * Handle Delete Click
   * 
   * Opens confirmation dialog before soft-deleting the task.
   * Soft-delete means setting isDeleted=true and deletedAt=timestamp,
   * moving the task to trash bin instead of permanently deleting it.
   */
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  /**
   * Confirm Soft Delete
   * 
   * This moves the task to trash (soft delete) by:
   * 1. Setting isDeleted flag to true
   * 2. Recording deletedAt timestamp
   * 3. Task will remain in trash for 30 days before auto-deletion
   * 
   * Users can restore the task from trash within 30 days.
   */
  const confirmDelete = () => {
    onDelete(task.id); // This should soft-delete, not permanent delete
    setShowDeleteDialog(false);
  };

  const isOverdue = task.deadline && !task.completed && isPast(parseISO(task.deadline));

  return (
    <>
      <Card className={cn(
        'p-4 hover:shadow-md transition-shadow rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
        task.completed && 'opacity-60',
        isOverdue && 'border-l-4 border-l-red-500'
      )}>
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {/* Title */}
                <h3 className={cn(
                  'font-medium text-gray-900 dark:text-gray-100',
                  task.completed && 'line-through text-gray-500 dark:text-gray-400'
                )}>
                  {task.title}
                </h3>

                {/* Description */}
                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {task.description}
                  </p>
                )}

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {/* Priority Badge */}
                  {task.priority && (
                    <Badge
                      variant="secondary"
                      className={cn('text-xs font-medium', priorityConfig[task.priority as keyof typeof priorityConfig]?.color)}
                    >
                      {priorityConfig[task.priority as keyof typeof priorityConfig]?.label || task.priority}
                    </Badge>
                  )}

                  {/* Deadline with Time */}
                  {task.deadline && (
                    <div className={cn(
                      'flex items-center gap-1 text-xs',
                      isOverdue
                        ? 'text-red-600 dark:text-red-500 font-medium'
                        : 'text-gray-500 dark:text-gray-500'
                    )}>
                      <Calendar className="w-3 h-3" />
                      <span>
                        {format(parseISO(task.deadline), 'MMM d, yyyy')}
                        {' at '}
                        {format(parseISO(task.deadline), 'h:mm a')}
                      </span>
                      {isOverdue && <span className="ml-1">(Overdue)</span>}
                    </div>
                  )}

                  {/* Created At */}
                  {task.createdAt && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>Created {format(parseISO(task.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md rounded-xl">
                  <DropdownMenuItem
                    onClick={handleEdit}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-gray-100"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-700 dark:focus:text-red-300"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        taskTitle={task.title}
      />
      <ConfirmUpdateDialog
        open={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        onConfirm={confirmUpdate}
        taskTitle={task.title}
      />

      {/* Complete Task Confirmation Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Complete Task
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you completed this task <span className="font-semibold text-gray-900 dark:text-gray-100">"{task.title}"</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowCompleteDialog(false);
                setPendingToggleState(null);
              }}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmComplete}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
            >
              Yes, Mark as Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reopen Task Confirmation Dialog */}
      <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Reopen Task
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to reopen this task <span className="font-semibold text-gray-900 dark:text-gray-100">"{task.title}"</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowReopenDialog(false);
                setPendingToggleState(null);
              }}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReopen}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              Yes, Reopen Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaskCard;