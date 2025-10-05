export class Task {
  id: number;
  title: string;
  description?: string;
  priority: string;
  deadline?: Date;
  completed: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}