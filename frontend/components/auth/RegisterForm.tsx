'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleSignInButton } from '@/components/auth/GoogleSignIn';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, CheckSquare, Moon, Sun, AlertCircle, Check, X, Info } from 'lucide-react';
import Link from 'next/link';
import { authApi } from '@/lib/api';

// Password validation
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
  
  const router = useRouter();
  const { addNotification } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!passwordValidation.allValid) {
      setError('Password does not meet all requirements');
      setShowPasswordRequirements(true);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register(email, password, name);

      // Store auth data
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Show success notification
      addNotification(
        'auth_status',
        'Registration Successful! 🎉',
        'Please check your email to verify your account.',
        undefined,
        { action: 'register', email }
      );

      // Redirect to verify email notice
      router.push('/verify-email-notice');
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      // FIXED: Handle specific error responses
      const errorResponse = error.response?.data;
      const statusCode = errorResponse?.statusCode || error.response?.status;
      
      let errorMessage = 'Registration failed. Please try again.';
      let shouldRedirect = false;
      
      // Handle 409 Conflict - Email already exists
      if (statusCode === 409 || errorResponse?.error === 'Conflict') {
        errorMessage = errorResponse?.message || 'This email is already registered. Please login instead.';
        shouldRedirect = true;
        
        setError(errorMessage);
        
        addNotification(
          'auth_status',
          'Email Already Registered',
          errorMessage,
          undefined,
          { action: 'register_conflict', email, redirectTo: 'login' }
        );

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push(`/login?email=${encodeURIComponent(email)}&message=email_exists`);
        }, 3000);
      } 
      // Handle other validation errors
      else if (errorResponse?.message) {
        errorMessage = errorResponse.message;
        setError(errorMessage);
        
        addNotification(
          'auth_status',
          'Registration Failed',
          errorMessage,
          undefined,
          { action: 'register_failed', email }
        );
      } 
      // Generic error
      else {
        setError(errorMessage);
        addNotification(
          'auth_status',
          'Registration Failed',
          error.message || errorMessage,
          undefined,
          { action: 'register_failed', email }
        );
      }
    } finally {
      if (!error) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 rounded-xl"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4169E1]">
            <CheckSquare className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quanby</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Task Manager</p>
          </div>
        </div>

        <p className="text-center text-gray-600 dark:text-gray-400">
          Create your account to get started.
        </p>

        {/* Register Form */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                  {error.includes('already registered') && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Redirecting to login page...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-900 dark:text-white">
                Full Name
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 rounded-xl"
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
                  className="pl-10 h-11 rounded-xl"
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
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordRequirements(true)}
                  className="pl-10 pr-10 h-11 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Requirements */}
              {showPasswordRequirements && password.length > 0 && (
                <div className="mt-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Password Requirements:</p>
                  <div className="space-y-1.5">
                    {[
                      { valid: passwordValidation.requirements.minLength, text: 'Minimum 8 characters' },
                      { valid: passwordValidation.requirements.hasUppercase, text: 'One uppercase letter (A-Z)' },
                      { valid: passwordValidation.requirements.hasLowercase, text: 'One lowercase letter (a-z)' },
                      { valid: passwordValidation.requirements.hasNumber, text: 'One number (0-9)' },
                      { valid: passwordValidation.requirements.hasSpecial, text: 'One special symbol (!@#$%^&*)' },
                      { valid: passwordValidation.requirements.noSpaces, text: 'No spaces' },
                    ].map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {req.valid ? <Check className="h-4 w-4 text-green-600 dark:text-green-400" /> : <X className="h-4 w-4 text-red-600 dark:text-red-400" />}
                        <span className={`text-xs ${req.valid ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>{req.text}</span>
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
                  className="pl-10 pr-10 h-11 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {passwordsMatch ? (
                    <>
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-700 dark:text-green-400">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs text-red-600 dark:text-red-400">Passwords do not match</span>
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
              {isLoading ? 'Creating Account...' : 'Register'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">or</span>
              </div>
            </div>

            {/* Google Sign-In */}
            <GoogleSignInButton mode="register" />
          </form>

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