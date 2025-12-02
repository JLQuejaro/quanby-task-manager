export declare function sendEmailVerificationEmail(email: string, token: string, userName?: string): Promise<void>;
export declare function sendGoogleVerificationEmail(email: string, token: string, userName?: string, mode?: 'login' | 'register'): Promise<void>;
export declare function sendPasswordSetEmail(email: string, userName?: string): Promise<void>;
export declare function sendPasswordChangedEmail(email: string, userName?: string): Promise<void>;
export declare function sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<void>;
export declare function sendAccountLockedEmail(email: string, resetToken: string, userName?: string): Promise<void>;
export declare function sendFailedAccountDeletionEmail(email: string, userName?: string): Promise<void>;
export declare function sendPasswordResetSuccessEmail(email: string, userName?: string): Promise<void>;
