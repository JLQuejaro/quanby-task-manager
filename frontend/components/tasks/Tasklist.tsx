// src/components/tasks/TaskList.tsx
'use client';
import { Task } from '@/lib/types';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: number, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

export function TaskList({ tasks, onToggleComplete, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-250px)] flex flex-col items-center justify-center">
        <div className="text-gray-400 dark:text-gray-500 mb-2">No tasks found</div>
        <p className="text-sm text-gray-500 dark:text-gray-600">Try changing your filters or create a new task</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 min-h-[calc(100vh-250px)]">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
