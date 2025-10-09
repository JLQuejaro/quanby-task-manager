'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Flag } from 'lucide-react';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => void;
  editTask?: Task | null;
}

export function CreateTaskDialog({ open, onClose, onSubmit, editTask }: CreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setPriority(editTask.priority);
      
      if (editTask.deadline) {
        const date = new Date(editTask.deadline);
        setDeadlineDate(date.toISOString().split('T')[0]);
        setDeadlineTime(date.toTimeString().slice(0, 5));
      }
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDeadlineDate('');
      setDeadlineTime('');
    }
  }, [editTask, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let deadline = undefined;
    if (deadlineDate) {
      if (deadlineTime) {
        deadline = new Date(`${deadlineDate}T${deadlineTime}`).toISOString();
      } else {
        deadline = new Date(deadlineDate).toISOString();
      }
    }

    onSubmit({
      title,
      description: description || undefined,
      priority,
      deadline,
    });

    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDeadlineDate('');
    setDeadlineTime('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold dark:text-white">
            {editTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium dark:text-gray-200">
              Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium dark:text-gray-200">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Add task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium dark:text-gray-200 flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Priority *
            </Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger className="rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white bg-white border border-gray-300 text-gray-900">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="rounded-xl dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-300">
                <SelectItem value="low" className="rounded-lg dark:text-white dark:focus:bg-gray-700 text-gray-900 focus:bg-gray-100">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Low Priority
                  </span>
                </SelectItem>
                <SelectItem value="medium" className="rounded-lg dark:text-white dark:focus:bg-gray-700 text-gray-900 focus:bg-gray-100">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Medium Priority
                  </span>
                </SelectItem>
                <SelectItem value="high" className="rounded-lg dark:text-white dark:focus:bg-gray-700 text-gray-900 focus:bg-gray-100">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    High Priority
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deadline Date & Time */}
          <div className="space-y-2">
            <Label className="text-sm font-medium dark:text-gray-200 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Deadline
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="deadline-date" className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
                  Date
                </Label>
                <Input
                  id="deadline-date"
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:[color-scheme:dark] h-11"
                />
              </div>
              <div>
                <Label htmlFor="deadline-time" className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
                  Time
                </Label>
                <Input
                  id="deadline-time"
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:[color-scheme:dark] h-11"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="rounded-xl bg-[#4169E1] hover:bg-[#3558CC] text-white"
            >
              {editTask ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>

        <div className="mt-2 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">Enter</kbd> to submit or{' '}
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">Esc</kbd> to cancel
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}