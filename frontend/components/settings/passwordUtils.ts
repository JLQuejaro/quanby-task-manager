// components/settings/passwordUtils.ts

import { PasswordValidation } from './types';

export const validatePassword = (password: string): PasswordValidation => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noSpaces: !/\s/.test(password),
  };
  const allValid = Object.values(requirements).every(Boolean);
  return { requirements, allValid };
};