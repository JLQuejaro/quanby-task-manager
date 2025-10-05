import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isPast, parseISO, isThisWeek } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Priority helpers
export function getPriorityColor(priority: 'low' | 'medium' | 'high') {
  const colors = {
    low: 'bg-success text-success-foreground',
    medium: 'bg-warning text-warning-foreground',
    high: 'bg-destructive text-destructive-foreground',
  };
  return colors[priority];
}

export function getPriorityLabel(priority: 'low' | 'medium' | 'high') {
  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };
  return labels[priority];
}

// Date helpers
export function formatTaskDate(dateString: string | undefined) {
  if (!dateString) return 'No deadline';
  
  const date = parseISO(dateString);
  
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`;
  
  return format(date, 'MMM dd, h:mm a');
}

export function isTaskOverdue(deadline: string | undefined, completed: boolean) {
  if (!deadline || completed) return false;
  return isPast(parseISO(deadline));
}

export function getTaskDateCategory(deadline: string | undefined) {
  if (!deadline) return 'upcoming';
  
  const date = parseISO(deadline);
  
  if (isPast(date)) return 'overdue';
  if (isToday(date)) return 'today';
  if (isTomorrow(date)) return 'tomorrow';
  if (isThisWeek(date)) return 'upcoming';
  
  return 'upcoming';
}

// Task filtering
export function filterTasks(tasks: any[], filter: string) {
  switch (filter) {
    case 'today':
      return tasks.filter(task => 
        task.deadline && isToday(parseISO(task.deadline)) && !task.completed
      );
    case 'tomorrow':
      return tasks.filter(task => 
        task.deadline && isTomorrow(parseISO(task.deadline)) && !task.completed
      );
    case 'upcoming':
      return tasks.filter(task => !task.completed);
    case 'completed':
      return tasks.filter(task => task.completed);
    case 'overdue':
      return tasks.filter(task => 
        task.deadline && isPast(parseISO(task.deadline)) && !task.completed
      );
    default:
      return tasks;
  }
}