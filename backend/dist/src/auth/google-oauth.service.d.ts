import { ConfigService } from '@nestjs/config';
import { SecurityLogService } from './security-log.service';
export interface GoogleTokenPayload {
    email: string;
    email_verified: boolean;
    name: string;
    picture?: string;
    sub: string;
    iat: number;
    exp: number;
    aud: string;
    iss: string;
}
export interface GoogleAuthResult {
    status: 'created' | 'existing' | 'pending_verification' | 'conflict' | 'no_account';
    user?: any;
    message?: string;
    requiresAction?: string;
    access_token?: string;
}
export declare class GoogleOAuthService {
    private configService;
    private securityLogService;
    private client;
    private pool;
    constructor(configService: ConfigService, securityLogService: SecurityLogService);
    validateIdToken(idToken: string, ipAddress?: string): Promise<GoogleTokenPayload>;
    handleGoogleAuthPassport(googleData: {
        email: string;
        name: string;
        picture?: string;
        googleId: string;
    }, ipAddress?: string, userAgent?: string): Promise<GoogleAuthResult>;
    handleGoogleAuth(idToken: string, ipAddress?: string, userAgent?: string): Promise<GoogleAuthResult>;
    private handleExistingUser;
    private handlePendingRegistration;
    private handleNewUser;
    startRegistrationFromPassport(googleData: {
        email: string;
        name: string;
        picture?: string;
        googleId: string;
    }, ipAddress?: string, userAgent?: string): Promise<GoogleAuthResult>;
    verifyGoogleUser(token: string, ipAddress?: string, userAgent?: string): Promise<{
        success: boolean;
        email: string;
        user: any;
    }>;
    private generateSecureToken;
    private findUserByEmail;
    private findUserByGoogleId;
    private findOAuthAccount;
    private linkOAuthAccount;
    private findTemporaryRegistration;
    private createTemporaryRegistration;
    private updateTemporaryRegistrationAttempt;
    private deleteTemporaryRegistration;
    private createVerifiedUserFromTemp;
    cleanupExpiredRegistrations(): Promise<void>;
}
