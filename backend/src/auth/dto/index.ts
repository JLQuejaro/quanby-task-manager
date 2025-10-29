// Export all DTOs
// Export all DTOs from their respective files
export * from './register.dto';
export * from './forgot-password.dto';
export * from './reset-password.dto';
export * from './verify-email.dto';
export * from './change-password.dto';
export * from './set-password.dto';
export * from './google-oauth-callback.dto';

// New DTOs
export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export class SetPasswordDto {
  password: string;
  passwordConfirm: string;
}

export class GoogleOAuthCallbackDto {
  idToken: string;
}

export class VerifyEmailDto {
  token: string;
}

export class ResendVerificationDto {
  email: string;
}