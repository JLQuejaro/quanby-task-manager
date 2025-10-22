import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetService } from './password-reset.service';
export declare class AuthController {
    private authService;
    private passwordResetService;
    constructor(authService: AuthService, passwordResetService: PasswordResetService);
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            authProvider: string;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            authProvider: string;
        };
    }>;
    googleAuth(req: Request): Promise<void>;
    googleAuthRedirect(req: Request, res: Response): Promise<void>;
    getProfile(req: Request): Promise<any>;
    getAllUsers(): Promise<{
        id: number;
        email: string;
        name: string;
        authProvider: string;
        createdAt: Date;
    }[]>;
    hasPassword(req: Request): Promise<{
        hasPassword: boolean;
    }>;
    setPassword(req: Request, body: {
        password: string;
    }): Promise<{
        message: string;
    }>;
    changePassword(req: Request, body: {
        oldPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
