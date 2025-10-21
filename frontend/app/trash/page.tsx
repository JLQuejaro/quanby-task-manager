// src/app/trash/page.tsx
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/lib/types';
import { TrashTaskCard } from '@/components/tasks/TrashTaskCard';
import { ConfirmRestoreDialog } from '@/components/tasks/ConfirmRestoreDialog';
import { ConfirmPermanentDeleteDialog } from '@/components/tasks/ConfirmPermanentDeleteDialog';
import { Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

/**
 * TrashPage Component
 * 
 * This page displays all deleted tasks (soft-deleted) and provides functionality to:
 * 1. View deleted tasks with remaining days before permanent deletion
 * 2. Restore tasks back to active state
 * 3. Permanently delete tasks immediately
 * 4. Auto-delete tasks that have been in trash for 30+ days
 * 
 * Workflow:
 * - When a task is deleted from main view, it's soft-deleted (isDeleted = true, deletedAt = timestamp)
 * - Tasks remain in trash for 30 days
 * - After 30 days, tasks are automatically permanently deleted
 * - Users can manually restore or permanently delete tasks anytime
 */
export default function TrashPage() {
  const { tasks: allTasks, updateTask, deleteTask: permanentDeleteTask } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);

  /**
   * Filter to get only deleted tasks (soft-deleted)
   * These are tasks where isDeleted = true
   */
  const trashedTasks = useMemo(() => {
    return allTasks.filter((task: Task) => task.isDeleted === true);
  }, [allTasks]);

  /**
   * Calculate statistics for trash bin
   */
  const trashStats = useMemo(() => {
    const now = new Date();
    const expiringSoon = trashedTasks.filter((task: Task) => {
      if (!task.deletedAt) return false;
      const deletedDate = parseISO(task.deletedAt);
      const daysInTrash = differenceInDays(now, deletedDate);
      return daysInTrash >= 25; // Tasks with 5 or fewer days remaining
    });

    return {
      total: trashedTasks.length,
      expiringSoon: expiringSoon.length,
    };
  }, [trashedTasks]);

  /**
   * Auto-Delete Tasks After 30 Days
   * 
   * This effect runs every 24 hours to check for tasks that have been
   * in the trash for 30+ days and permanently deletes them.
   * 
   * Logic:
   * 1. Get current timestamp
   * 2. For each trashed task, calculate days since deletion
   * 3. If days >= 30, permanently delete the task
   * 4. This runs on component mount and every 24 hours
   */
  useEffect(() => {
    const checkAndDeleteExpiredTasks = () => {
      const now = new Date();
      
      trashedTasks.forEach((task: Task) => {
        if (!task.deletedAt) return;
        
        const deletedDate = parseISO(task.deletedAt);
        const daysSinceDeletion = differenceInDays(now, deletedDate);
        
        // If task has been in trash for 30+ days, permanently delete it
        if (daysSinceDeletion >= 30) {
          console.log(`Auto-deleting task ${task.id} - ${daysSinceDeletion} days in trash`);
          permanentDeleteTask(task.id);
        }
      });
    };

    // Run immediately on mount
    checkAndDeleteExpiredTasks();

    // Set up interval to check every 24 hours (86400000 ms)
    const interval = setInterval(checkAndDeleteExpiredTasks, 24 * 60 * 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [trashedTasks, permanentDeleteTask]);

  /**
   * Calculate days remaining before permanent deletion
   * 
   * @param deletedAt - ISO timestamp when task was deleted
   * @returns Number of days remaining (0-30)
   */
  const getDaysRemaining = (deletedAt: string): number => {
    const now = new Date();
    const deletedDate = parseISO(deletedAt);
    const daysPassed = differenceInDays(now, deletedDate);
    const daysRemaining = 30 - daysPassed;
    return Math.max(0, daysRemaining); // Never return negative
  };

  /**
   * Restore Task Handler
   * 
   * Restores a soft-deleted task back to active state by:
   * 1. Setting isDeleted to false
   * 2. Removing the deletedAt timestamp
   * 3. Updating the updatedAt timestamp
   * 
   * @param task - The task to restore
   */
  const handleRestoreClick = (task: Task) => {
    setSelectedTask(task);
    setShowRestoreDialog(true);
  };

  const confirmRestore = () => {
    if (!selectedTask) return;

    // Restore task by updating its flags
    updateTask({
      id: selectedTask.id,
      data: {
        isDeleted: false,
        deletedAt: undefined,
        updatedAt: new Date().toISOString(),
      },
    });

    // Close dialog and reset state
    setShowRestoreDialog(false);
    setSelectedTask(null);
  };

  /**
   * Permanent Delete Handler
   * 
   * Permanently deletes a task from the database.
   * This action cannot be undone.
   * 
   * @param task - The task to permanently delete
   */
  const handlePermanentDeleteClick = (task: Task) => {
    setSelectedTask(task);
    setShowPermanentDeleteDialog(true);
  };

  const confirmPermanentDelete = () => {
    if (!selectedTask) return;

    // Permanently delete the task
    permanentDeleteTask(selectedTask.id);

    // Close dialog and reset state
    setShowPermanentDeleteDialog(false);
    setSelectedTask(null);
  };

  /**
   * Empty Trash Handler
   * 
   * Permanently deletes all tasks in the trash bin.
   * Shows confirmation before proceeding.
   */
  const handleEmptyTrash = () => {
    if (window.confirm(`Are you sure you want to permanently delete all ${trashedTasks.length} tasks? This action cannot be undone.`)) {
      trashedTasks.forEach((task: Task) => {
        permanentDeleteTask(task.id);
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <Header title="Trash Bin" />
      
      <div className="p-6">
        {/* Trash Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {trashStats.total}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Tasks in Trash
                  </div>
                </div>
                <Trash2 className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
                    {trashStats.expiringSoon}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Expiring Soon (&lt;5 days)
                  </div>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center justify-center">
              <Button
                variant="destructive"
                onClick={handleEmptyTrash}
                disabled={trashedTasks.length === 0}
                className="w-full rounded-xl"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Empty Trash
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="rounded-2xl mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Tasks in the trash will be permanently deleted after 30 days. You can restore or permanently delete them anytime.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trashed Tasks */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="dark:text-white">Deleted Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {trashedTasks.length === 0 ? (
              <div className="text-center py-16">
                <Trash2 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                  Trash is Empty
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-600">
                  Deleted tasks will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {trashedTasks.map((task: Task) => (
                  <TrashTaskCard
                    key={task.id}
                    task={task}
                    daysRemaining={task.deletedAt ? getDaysRemaining(task.deletedAt) : 0}
                    onRestore={() => handleRestoreClick(task)}
                    onPermanentDelete={() => handlePermanentDeleteClick(task)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Restore Confirmation Dialog */}
      <ConfirmRestoreDialog
        open={showRestoreDialog}
        onClose={() => {
          setShowRestoreDialog(false);
          setSelectedTask(null);
        }}
        onConfirm={confirmRestore}
        taskTitle={selectedTask?.title || ''}
      />

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmPermanentDeleteDialog
        open={showPermanentDeleteDialog}
        onClose={() => {
          setShowPermanentDeleteDialog(false);
          setSelectedTask(null);
        }}
        onConfirm={confirmPermanentDelete}
        taskTitle={selectedTask?.title || ''}
      />
    </div>
  );
}