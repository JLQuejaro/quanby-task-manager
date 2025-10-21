// src/components/tasks/TrashTaskCard.tsx
'use client';
import { Task } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface TrashTaskCardProps {
  task: Task;
  daysRemaining: number; // Days until permanent deletion
  onRestore: () => void;
  onPermanentDelete: () => void;
}

const priorityConfig = {
  high: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'High' },
  medium: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Medium' },
  low: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Low' },
};

/**
 * TrashTaskCard Component
 * 
 * Displays a deleted task in the trash bin with:
 * - Task information (title, description, priority, deadline)
 * - Days remaining until permanent deletion (with color coding)
 * - Restore button to move task back to active
 * - Permanent delete button for immediate removal
 * 
 * Color coding for days remaining:
 * - Green: 10+ days
 * - Orange: 5-9 days
 * - Red: 0-4 days (expiring soon)
 */
export const TrashTaskCard = ({ 
  task, 
  daysRemaining, 
  onRestore, 
  onPermanentDelete 
}: TrashTaskCardProps) => {
  /**
   * Determine the color for days remaining badge
   * - Red for urgent (0-4 days)
   * - Orange for warning (5-9 days)
   * - Green for safe (10+ days)
   */
  const getDaysRemainingColor = () => {
    if (daysRemaining <= 4) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (daysRemaining <= 9) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  };

  const isExpiringSoon = daysRemaining <= 4;

  return (
    <Card className={cn(
      'p-4 hover:shadow-md transition-shadow rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-75',
      isExpiringSoon && 'border-l-4 border-l-red-500'
    )}>
      <div className="flex items-start gap-3">
        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-medium text-gray-900 dark:text-gray-100 line-through">
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-through">
              {task.description}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* Days Remaining Badge - Most Important */}
            <Badge
              variant="secondary"
              className={cn('text-xs font-bold', getDaysRemainingColor())}
            >
              {isExpiringSoon && <AlertTriangle className="w-3 h-3 mr-1" />}
              {daysRemaining === 0 ? 'Expires Today' : `${daysRemaining} days left`}
            </Badge>

            {/* Priority Badge */}
            {task.priority && (
              <Badge
                variant="secondary"
                className={cn('text-xs font-medium', priorityConfig[task.priority as keyof typeof priorityConfig]?.color)}
              >
                {priorityConfig[task.priority as keyof typeof priorityConfig]?.label || task.priority}
              </Badge>
            )}

            {/* Original Deadline */}
            {task.deadline && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>Due: {format(parseISO(task.deadline), 'MMM d, yyyy')}</span>
              </div>
            )}

            {/* Deleted At */}
            {task.deletedAt && (
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600">
                <Clock className="w-3 h-3" />
                <span>Deleted {format(parseISO(task.deletedAt), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Restore Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRestore}
            className="rounded-lg border-green-500 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restore
          </Button>

          {/* Permanent Delete Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onPermanentDelete}
            className="rounded-lg border-red-500 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Forever
          </Button>
        </div>
      </div>
    </Card>
  );
};