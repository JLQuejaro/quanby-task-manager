import { useState } from 'react';
import { Archive, Info, Trash2, Folder } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArchivedTaskCard } from './ArchivedTaskCard';
import { ArchivedTask } from './types';

interface ArchiveSectionProps {
  tasks: ArchivedTask[];
  isLoading: boolean;
  onRestore: (taskId: string, taskTitle: string) => void;
  onDelete: (taskId: string, taskTitle: string) => void;
  onClearAll: () => void;
}

export function ArchiveSection({ tasks, isLoading, onRestore, onDelete, onClearAll }: ArchiveSectionProps) {
  const [showArchive, setShowArchive] = useState(false);

  return (
    <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-[#4169E1]" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Task Archive
            </h2>
            {tasks.length > 0 && (
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </span>
            )}
          </div>
          {tasks.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchive(!showArchive)}
              className="rounded-xl"
            >
              {showArchive ? 'Hide' : 'Show'} Archive
            </Button>
          )}
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Deleted Tasks Storage
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Deleted tasks are stored here for 30 days before being permanently removed. You can restore them anytime within this period.
              </p>
            </div>
          </div>
        </div>

        {showArchive && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent mx-auto"></div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading archive...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No archived tasks</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Deleted tasks will appear here for 30 days
                </p>
              </div>
            ) : (
              <>
                {tasks.map((task) => (
                  <ArchivedTaskCard
                    key={task.id}
                    task={task}
                    onRestore={onRestore}
                    onDelete={onDelete}
                  />
                ))}

                {tasks.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={onClearAll}
                    className="w-full mt-4 rounded-xl text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Archived Tasks
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}