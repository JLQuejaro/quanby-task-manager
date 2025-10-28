export declare class PasswordResetService {
    private pool;
    constructor();
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    hasActiveResetToken(userId: number): Promise<boolean>;
    private generateSecureToken;
    private hashToken;
    private getTokenExpiry;
    private createResetToken;
    private validateResetToken;
    private markTokenAsUsed;
    private revokeAllUserSessions;
    private validatePasswordStrength;
    cleanup(): Promise<void>;
}
