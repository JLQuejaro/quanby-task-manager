import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto } from './dto/register.dto';
import { EmailVerificationService } from './email-verification.service';
import { SecurityLogService } from './security-log.service';
import { RateLimitService } from './rate-limit.service';
export declare class AuthService {
    private jwtService;
    private emailVerificationService;
    private securityLogService;
    private rateLimitService;
    private pool;
    constructor(jwtService: JwtService, emailVerificationService: EmailVerificationService, securityLogService: SecurityLogService, rateLimitService: RateLimitService);
    register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            authProvider: string;
            emailVerified: boolean;
        };
        message: string;
    }>;
    login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            authProvider: string;
            emailVerified: boolean;
        };
    }>;
    googleLogin(googleUser: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            authProvider: string;
            emailVerified: boolean;
        };
    }>;
    validateUser(userId: number): Promise<{
        id: number;
        email: string;
        name: string;
        authProvider: string;
        googleId: string;
        emailVerified: boolean;
        verificationToken: string;
        lastPasswordChange: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAllUsers(): Promise<{
        id: number;
        email: string;
        name: string;
        authProvider: string;
        emailVerified: boolean;
        createdAt: Date;
    }[]>;
    setPassword(userId: number, newPassword: string, confirmPassword: string, ipAddress?: string, userAgent?: string): Promise<{
        message: string;
    }>;
    hasPassword(userId: number): Promise<{
        hasPassword: boolean;
    }>;
    changePassword(userId: number, currentPassword: string, newPassword: string, confirmPassword: string, ipAddress?: string, userAgent?: string): Promise<{
        message: string;
    }>;
    private validatePasswordStrength;
    private createSession;
    private revokeAllUserSessions;
}
