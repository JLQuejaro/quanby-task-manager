import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './google-oauth.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { RateLimitService } from './rate-limit.service';
import { RegisterDto, LoginDto, ChangePasswordDto, SetPasswordDto, GoogleOAuthCallbackDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto';
export declare class AuthController {
    private authService;
    private googleOAuthService;
    private emailVerificationService;
    private passwordResetService;
    private rateLimitService;
    constructor(authService: AuthService, googleOAuthService: GoogleOAuthService, emailVerificationService: EmailVerificationService, passwordResetService: PasswordResetService, rateLimitService: RateLimitService);
    register(registerDto: RegisterDto, ip: string, userAgent: string): Promise<{
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
    login(loginDto: LoginDto, ip: string, userAgent: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            authProvider: string;
            emailVerified: boolean;
        };
    }>;
    googleCallback(callbackDto: GoogleOAuthCallbackDto, ip: string, userAgent: string): Promise<import("./google-oauth.service").GoogleAuthResult>;
    verifyGoogleEmail(body: {
        token: string;
    }, ip: string, userAgent: string): Promise<{
        success: boolean;
        message: string;
        access_token: string;
        user: any;
    }>;
    googleAuth(req: Request): Promise<void>;
    googleAuthRedirect(req: Request, res: Response): Promise<void>;
    verifyEmailGet(token: string, ip: string): Promise<{
        success: boolean;
        email: string;
        access_token: string;
        user: any;
    }>;
    verifyEmail(verifyEmailDto: VerifyEmailDto, ip: string): Promise<{
        success: boolean;
        email: string;
        access_token: string;
        user: any;
    }>;
    resendVerification(req: Request, body?: {
        force?: boolean;
    }): Promise<{
        message: string;
        forced: true;
    }>;
    verificationStatus(req: Request): Promise<{
        emailVerified: boolean;
        hasPendingVerification: boolean;
    }>;
    setPassword(req: Request, setPasswordDto: SetPasswordDto, ip: string, userAgent: string): Promise<{
        message: string;
    }>;
    changePassword(req: Request, changePasswordDto: ChangePasswordDto, ip: string, userAgent: string): Promise<{
        message: string;
    }>;
    hasPassword(req: Request): Promise<{
        hasPassword: boolean;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto, ip: string): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto, ip: string): Promise<{
        message: string;
    }>;
    getProfile(req: Request): Promise<any>;
    getAllUsers(): Promise<{
        id: number;
        email: string;
        name: string;
        authProvider: string;
        emailVerified: boolean;
        createdAt: Date;
    }[]>;
}
