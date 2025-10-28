export declare function sendEmailVerificationEmail(email: string, token: string, userName?: string): Promise<void>;
export declare function sendPasswordChangedEmail(email: string, userName?: string): Promise<void>;
export declare function sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<void>;
