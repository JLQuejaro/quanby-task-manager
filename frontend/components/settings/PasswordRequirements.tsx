// components/settings/PasswordRequirements.tsx

import { Check, X } from 'lucide-react';
import { PasswordValidation } from './types';

interface PasswordRequirementsProps {
  validation: PasswordValidation;
  show: boolean;
}

export function PasswordRequirements({ validation, show }: PasswordRequirementsProps) {
  if (!show) return null;

  const requirements = [
    { valid: validation.requirements.minLength, text: 'Minimum of 8 characters' },
    { valid: validation.requirements.hasUppercase, text: 'At least one uppercase letter (A–Z)' },
    { valid: validation.requirements.hasLowercase, text: 'At least one lowercase letter (a–z)' },
    { valid: validation.requirements.hasNumber, text: 'At least one number (0–9)' },
    { valid: validation.requirements.hasSpecial, text: 'At least one special symbol (! @ # $ % ^ & *)' },
    { valid: validation.requirements.noSpaces, text: 'No spaces allowed' },
  ];

  return (
    <div className="mt-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 space-y-2">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Password Requirements:
      </p>
      <div className="space-y-1.5">
        {requirements.map((requirement, index) => (
          <div key={index} className="flex items-center gap-2">
            {requirement.valid ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <span
              className={`text-xs ${
                requirement.valid
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {requirement.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}