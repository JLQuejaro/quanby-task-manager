import { formatTaskDate, isTaskOverdue } from '@/lib/utils';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateDisplayProps {
  deadline?: string;
  completed: boolean;
  className?: string;
}

export function DateDisplay({ deadline, completed, className }: DateDisplayProps) {
  const isOverdue = isTaskOverdue(deadline, completed);
  const formattedDate = formatTaskDate(deadline);

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {isOverdue ? (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive font-medium">{formattedDate}</span>
        </>
      ) : (
        <>
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{formattedDate}</span>
        </>
      )}
    </div>
  );
}