import { CheckSquare } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
        <CheckSquare className="h-7 w-7 text-white" strokeWidth={2.5} />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quanby</h1>
        <p className="text-sm text-gray-600">Task Manager</p>
      </div>
    </div>
  );
}