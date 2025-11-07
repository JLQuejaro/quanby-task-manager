import { JwtService } from '@nestjs/jwt';
export declare class EmailVerificationService {
    private jwtService;
    private pool;
    constructor(jwtService: JwtService);
    sendVerificationEmail(userId: number, email: string, name?: string): Promise<void>;
    resendVerificationEmail(userId: number, force?: boolean): Promise<void>;
    verifyEmailAndGenerateToken(token: string): Promise<{
        success: boolean;
        email: string;
        access_token: string;
        user: any;
    }>;
    verifyEmail(token: string): Promise<{
        userId: number;
        email: string;
    }>;
    isEmailVerified(userId: number): Promise<boolean>;
    hasPendingVerification(userId: number): Promise<boolean>;
    private generateSecureToken;
    private hashToken;
    private getTokenExpiry;
    private createVerificationToken;
    private validateVerificationToken;
    private checkIfTokenAlreadyUsed;
    private markEmailAsVerified;
    private markTokenAsUsed;
    private getUserData;
}
