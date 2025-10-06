'use client';

import { Task } from '@/lib/types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: number, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

export function TaskList({ tasks, onToggleComplete, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">No tasks found</div>
        <p className="text-sm text-gray-500">Try changing your filters or create a new task</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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