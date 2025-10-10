import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto } from './dto/register.dto';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        id: number;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
        };
    }>;
    googleLogin(googleUser: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
        };
    }>;
    validateUser(userId: number): Promise<{
        id: number;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAllUsers(): Promise<{
        id: number;
        email: string;
        name: string;
        createdAt: Date;
    }[]>;
}
