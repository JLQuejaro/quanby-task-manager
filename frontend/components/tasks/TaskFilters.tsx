'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface TaskFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  taskCounts: {
    all: number;
    overdue: number;
    today: number;
    tomorrow: number;
    upcoming: number;
    completed: number;
  };
}

export function TaskFilters({ activeFilter, onFilterChange, taskCounts }: TaskFiltersProps) {
  const filters = [
    { id: 'all', label: 'All Tasks', count: taskCounts.all },
    { 
      id: 'overdue', 
      label: 'Overdue', 
      count: taskCounts.overdue,
      isOverdue: true 
    },
    { id: 'today', label: 'Today', count: taskCounts.today },
    { id: 'tomorrow', label: 'Tomorrow', count: taskCounts.tomorrow },
    { id: 'upcoming', label: 'Upcoming', count: taskCounts.upcoming },
    { id: 'completed', label: 'Completed', count: taskCounts.completed },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? 'default' : 'outline'}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            'rounded-xl',
            activeFilter === filter.id && !filter.isOverdue && 'bg-[#4169E1] hover:bg-[#3558CC]',
            activeFilter === filter.id && filter.isOverdue && 'bg-red-600 hover:bg-red-700',
            !activeFilter && filter.isOverdue && filter.count > 0 && 'border-red-300 dark:border-red-800 text-red-600 dark:text-red-400',
            activeFilter !== filter.id && filter.isOverdue && filter.count > 0 && 'border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
          )}
        >
          {filter.isOverdue && filter.count > 0 && (
            <AlertCircle className="h-4 w-4 mr-1" />
          )}
          {filter.label}
          <span className={cn(
            'ml-2 rounded-full px-2 py-0.5 text-xs',
            activeFilter === filter.id && !filter.isOverdue && 'bg-white/20',
            activeFilter === filter.id && filter.isOverdue && 'bg-white/20',
            activeFilter !== filter.id && filter.isOverdue && filter.count > 0 && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
            activeFilter !== filter.id && !filter.isOverdue && 'bg-gray-100 dark:bg-gray-800'
          )}>
            {filter.count}
          </span>
        </Button>
      ))}
    </div>
  );
}