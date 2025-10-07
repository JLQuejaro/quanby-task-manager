'use client';

import { useState } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsDialog } from '@/components/shared/KeyboardShortcutsDialog';
import { Header } from '@/components/layout/Header';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/lib/types';
import { Plus } from 'lucide-react';

export default function TasksPage() {
  const { tasks, isLoading, createTask, updateTask, deleteTask, toggleComplete } = useTasks();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      callback: () => setIsCreateDialogOpen(true),
      preventDefault: true,
    },
    {
      key: '/',
      callback: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
      },
      preventDefault: true,
    },
    {
      key: '?',
      shiftKey: true,
      callback: () => setShowShortcutsDialog(true),
      preventDefault: true,
    },
  ]);

  const handleCreateTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask({ id: editingTask.id, data: taskData });
      setEditingTask(null);
    } else {
      createTask(taskData);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingTask(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4169E1] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Filter tasks based on search
  const filteredTasks = searchTerm.trim()
    ? tasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : tasks;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <Header 
        title="All Tasks" 
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="p-6 space-y-6">
        {/* Header with New Task Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Tasks</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} 
              {searchTerm.trim() && ` found`}
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-[#4169E1] hover:bg-[#3558CC] rounded-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Task
          </Button>
        </div>

        {/* Task List */}
        <TaskList
          tasks={filteredTasks}
          onToggleComplete={toggleComplete}
          onEdit={handleEditTask}
          onDelete={deleteTask}
        />
      </div>

      {/* Create/Edit Task Dialog */}
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleCreateTask}
        editTask={editingTask}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showShortcutsDialog}
        onClose={() => setShowShortcutsDialog(false)}
      />
    </div>
  );
}