'use client';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, Eye, EyeOff, CheckSquare, Moon, Sun, AlertCircle, Check, X } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { GoogleSignInButton } from '@/components/auth/GoogleSignIn';

// Password validation function
const validatePassword = (password: string) => {
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

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { addNotification } = useNotifications();
  const { setUser } = useAuth();
  const router = useRouter();

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password requirements
    if (!passwordValidation.allValid) {
      setError('Password does not meet all requirements');
      setShowPasswordRequirements(true);
      addNotification(
        'auth_status',
        'Invalid Password',
        'Please ensure your password meets all the requirements.',
        undefined,
        { action: 'password_validation_failed' }
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      addNotification(
        'auth_status',
        'Passwords Do Not Match',
        'Please make sure both password fields are identical.',
        undefined,
        { action: 'password_mismatch' }
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({ name, email, password });

      if (!response || !response.user) {
        throw new Error('Invalid registration response');
      }

      // Store token and user
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Update auth context
      setUser(response.user);

      // Check if email verification is required
      if (response.user.emailVerified === false) {
        addNotification(
          'auth_status',
          'Account Created Successfully! 🎉',
          `Welcome ${response.user.name}! Please verify your email to continue.`,
          undefined,
          { action: 'register', email: response.user.email }
        );

        // Redirect to email verification notice
        router.push('/verify-email-notice');
      } else {
        // If email is already verified (shouldn't happen in normal flow)
        addNotification(
          'auth_status',
          'Account Created Successfully! 🎉',
          `Welcome ${response.user.name}! Your account has been successfully created.`,
          undefined,
          { action: 'register', email: response.user.email }
        );

        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';

      // Handle duplicate email error
      if (error.response?.status === 400 && errorMessage.includes('already exists')) {
        errorMessage = 'An account with this email already exists. Please login or use a different email.';
      }

      setError(errorMessage);

      addNotification(
        'auth_status',
        'Registration Failed ❌',
        errorMessage,
        undefined,
        { action: 'register_failed', email }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      {/* Theme Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 rounded-xl"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      <div className="w-full max-w-md space-y-8">
        {/* Logo - Horizontal Layout */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4169E1]">
            <CheckSquare className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quanby</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Task Manager</p>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-center text-gray-600 dark:text-gray-400">
          Create your account and start organizing.
        </p>

        {/* Register Form */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-900 dark:text-white">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-white">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-white">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordRequirements(true)}
                  className="pl-10 pr-10 h-11 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              {showPasswordRequirements && password.length > 0 && (
                <div className="mt-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password Requirements:
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { valid: passwordValidation.requirements.minLength, text: 'Minimum of 8 characters' },
                      { valid: passwordValidation.requirements.hasUppercase, text: 'At least one uppercase letter (A–Z)' },
                      { valid: passwordValidation.requirements.hasLowercase, text: 'At least one lowercase letter (a–z)' },
                      { valid: passwordValidation.requirements.hasNumber, text: 'At least one number (0–9)' },
                      { valid: passwordValidation.requirements.hasSpecial, text: 'At least one special symbol (! @ # $ % ^ & *)' },
                      { valid: passwordValidation.requirements.noSpaces, text: 'No spaces allowed' },
                    ].map((requirement, index) => (
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
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900 dark:text-white">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {passwordsMatch ? (
                    <>
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-700 dark:text-green-400">
                        Passwords match
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs text-red-600 dark:text-red-400">
                        Passwords do not match
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-[#4169E1] hover:bg-[#3558CC] text-white font-medium rounded-xl"
              disabled={isLoading || !passwordValidation.allValid || !passwordsMatch}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Creating account...
                </span>
              ) : (
                'Register'
              )}
            </Button>
          </form>

          {/* Divider and Google Sign-In */}
          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-800 px-4 text-gray-500 dark:text-gray-400">
                or continue with
              </span>
            </div>
          </div>
          <div className="mt-6">
            <GoogleSignInButton />
          </div>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-[#4169E1] hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}