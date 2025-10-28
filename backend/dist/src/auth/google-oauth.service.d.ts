import { ConfigService } from '@nestjs/config';
import { EmailVerificationService } from './email-verification.service';
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
    status: 'created' | 'existing' | 'pending_verification' | 'conflict';
    user?: any;
    message?: string;
    requiresAction?: string;
}
export declare class GoogleOAuthService {
    private configService;
    private emailVerificationService;
    private securityLogService;
    private client;
    private pool;
    constructor(configService: ConfigService, emailVerificationService: EmailVerificationService, securityLogService: SecurityLogService);
    validateIdToken(idToken: string, ipAddress?: string): Promise<GoogleTokenPayload>;
    handleGoogleAuth(idToken: string, ipAddress?: string, userAgent?: string): Promise<GoogleAuthResult>;
    private handleExistingUser;
    private handleNewUser;
    private createVerifiedUser;
    private createPendingUser;
    private linkOAuthAccount;
    private findUserByEmail;
    private findOAuthAccount;
}
