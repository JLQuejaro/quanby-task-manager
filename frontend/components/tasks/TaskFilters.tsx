'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  taskCounts: {
    all: number;
    today: number;
    tomorrow: number;
    upcoming: number;
    completed: number;
  };
}

export function TaskFilters({ activeFilter, onFilterChange, taskCounts }: TaskFiltersProps) {
  const filters = [
    { id: 'all', label: 'All Tasks', count: taskCounts.all },
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
            activeFilter === filter.id && 'bg-[#4169E1] hover:bg-[#3558CC]'
          )}
        >
          {filter.label}
          <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {filter.count}
          </span>
        </Button>
      ))}
    </div>
  );
}