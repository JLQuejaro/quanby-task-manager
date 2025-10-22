export declare class PasswordResetService {
    private pool;
    constructor();
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    private createPasswordResetToken;
    private validateResetToken;
    private markTokenAsUsed;
    private getUserByEmail;
    private updateUserPassword;
}
