import { Moon, Sun } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface AppearanceSectionProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function AppearanceSection({ theme, onToggleTheme }: AppearanceSectionProps) {
  return (
    <Card className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          {theme === 'dark' ? (
            <Moon className="h-5 w-5 text-[#4169E1]" />
          ) : (
            <Sun className="h-5 w-5 text-[#4169E1]" />
          )}
          Appearance
        </h2>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Dark Mode</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={onToggleTheme}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

