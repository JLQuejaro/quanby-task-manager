import { RotateCcw, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArchivedTask } from '@/components/settings/types';

interface ArchivedTaskCardProps {
  task: ArchivedTask;
  onRestore: (taskId: string, taskTitle: string) => void;
  onDelete: (taskId: string, taskTitle: string) => void;
}

export function ArchivedTaskCard({ task, onRestore, onDelete }: ArchivedTaskCardProps) {
  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysRemaining = getDaysRemaining(task.expiresAt);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full ${
              task.priority === 'high'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : task.priority === 'medium'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            }`}>
              {task.priority}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRestore(task.id, task.title)}
            className="rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-800"
            title="Restore task"
          >
            <RotateCcw className="h-4 w-4 text-green-600 dark:text-green-400" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(task.id, task.title)}
            className="rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800"
            title="Delete permanently"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}