import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto } from './dto/register.dto';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
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
    googleLogin(googleUser: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            authProvider: string;
        };
    }>;
    validateUser(userId: number): Promise<{
        id: number;
        email: string;
        name: string;
        authProvider: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAllUsers(): Promise<{
        id: number;
        email: string;
        name: string;
        authProvider: string;
        createdAt: Date;
    }[]>;
    setPassword(userId: number, newPassword: string): Promise<{
        message: string;
    }>;
    hasPassword(userId: number): Promise<{
        hasPassword: boolean;
    }>;
    changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
}
