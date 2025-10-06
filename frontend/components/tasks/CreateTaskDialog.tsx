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
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setPriority(editTask.priority);
      setDeadline(editTask.deadline ? editTask.deadline.split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDeadline('');
    }
  }, [editTask, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      title,
      description: description || undefined,
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDeadline('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white z-50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Add task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium">
              Priority <span className="text-red-500">*</span>
            </Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="bg-white z-[100]">
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Low
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                    Medium
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    High
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-sm font-medium">
              Deadline
            </Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#4169E1] hover:bg-[#3558CC] w-full sm:w-auto"
              disabled={!title.trim()}
            >
              {editTask ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}