import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high';
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const variants = {
    low: 'bg-success hover:bg-success/80 text-white',
    medium: 'bg-warning hover:bg-warning/80 text-white',
    high: 'bg-destructive hover:bg-destructive/80 text-white',
  };

  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };

  return (
    <Badge className={cn(variants[priority], 'font-medium rounded-full', className)}>
      {labels[priority]}
    </Badge>
  );
}