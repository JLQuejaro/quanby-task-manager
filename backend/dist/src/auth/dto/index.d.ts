export * from './register.dto';
export * from './forgot-password.dto';
export * from './reset-password.dto';
export * from './verify-email.dto';
export * from './change-password.dto';
export * from './set-password.dto';
export * from './google-oauth-callback.dto';
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
}
export declare class SetPasswordDto {
    password: string;
    passwordConfirm: string;
}
export declare class GoogleOAuthCallbackDto {
    idToken: string;
}
export declare class VerifyEmailDto {
    token: string;
}
export declare class ResendVerificationDto {
    email: string;
}
