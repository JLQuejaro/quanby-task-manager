"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const db_1 = require("../database/db");
const schema_1 = require("../database/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const pg_1 = require("pg");
const email_verification_service_1 = require("./email-verification.service");
const security_log_service_1 = require("./security-log.service");
const rate_limit_service_1 = require("./rate-limit.service");
const email_1 = require("../lib/email");
let AuthService = class AuthService {
    constructor(jwtService, emailVerificationService, securityLogService, rateLimitService) {
        this.jwtService = jwtService;
        this.emailVerificationService = emailVerificationService;
        this.securityLogService = securityLogService;
        this.rateLimitService = rateLimitService;
        this.pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }
    async register(registerDto, ipAddress, userAgent) {
        await this.rateLimitService.checkRateLimit(ipAddress || 'unknown', 'register');
        const [existingUser] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, registerDto.email));
        if (existingUser) {
            await this.securityLogService.log({
                email: registerDto.email,
                eventType: 'register_failed',
                success: false,
                ipAddress,
                userAgent,
                metadata: { reason: 'Email already registered' },
            });
            throw new common_1.UnauthorizedException('Email already registered');
        }
        this.validatePasswordStrength(registerDto.password);
        const hashedPassword = await bcrypt.hash(registerDto.password, 12);
        const [user] = await db_1.db.insert(schema_1.users).values({
            email: registerDto.email,
            password: hashedPassword,
            name: registerDto.name,
            authProvider: 'email',
            emailVerified: false,
        }).returning();
        await this.emailVerificationService.sendVerificationEmail(user.id, user.email, user.name);
        await this.securityLogService.log({
            userId: user.id,
            email: user.email,
            eventType: 'register',
            success: true,
            ipAddress,
            userAgent,
            metadata: { authProvider: 'email', emailVerificationSent: true },
        });
        await this.rateLimitService.resetRateLimit(ipAddress || 'unknown', 'register');
        const payload = { sub: user.id, email: user.email };
        const accessToken = await this.jwtService.signAsync(payload);
        await this.createSession(user.id, accessToken, ipAddress, userAgent);
        console.log('✅ New user registered:', user.email);
        return {
            access_token: accessToken,
            user: {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                authProvider: user.authProvider || 'email',
                emailVerified: false,
            },
            message: 'Registration successful. Please verify your email.',
        };
    }
    async login(loginDto, ipAddress, userAgent) {
        await this.rateLimitService.checkRateLimit(ipAddress || 'unknown', 'login');
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, loginDto.email));
        if (!user) {
            await this.securityLogService.log({
                email: loginDto.email,
                eventType: 'login_failed',
                success: false,
                ipAddress,
                userAgent,
                metadata: { reason: 'User not found' },
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.password) {
            await this.securityLogService.log({
                userId: user.id,
                email: user.email,
                eventType: 'login_failed',
                success: false,
                ipAddress,
                userAgent,
                metadata: { reason: 'No password set' },
            });
            throw new common_1.UnauthorizedException('No password set. Please set a password first or use Google Sign-In.');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            await this.securityLogService.log({
                userId: user.id,
                email: user.email,
                eventType: 'login_failed',
                success: false,
                ipAddress,
                userAgent,
                metadata: { reason: 'Invalid password' },
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.securityLogService.log({
            userId: user.id,
            email: user.email,
            eventType: 'login',
            success: true,
            ipAddress,
            userAgent,
        });
        await this.rateLimitService.resetRateLimit(ipAddress || 'unknown', 'login');
        const payload = { sub: user.id, email: user.email };
        const accessToken = await this.jwtService.signAsync(payload);
        await this.createSession(user.id, accessToken, ipAddress, userAgent);
        console.log('✅ User logged in:', user.email);
        return {
            access_token: accessToken,
            user: {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                authProvider: user.authProvider || 'email',
                emailVerified: user.emailVerified || false,
            },
        };
    }
    async googleLogin(googleUser) {
        try {
            let [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, googleUser.email));
            if (!user) {
                console.log('🆕 Creating new Google user:', googleUser.email);
                const randomPassword = crypto.randomBytes(32).toString('hex');
                [user] = await db_1.db.insert(schema_1.users).values({
                    email: googleUser.email,
                    name: googleUser.name,
                    password: randomPassword,
                    authProvider: 'google',
                    emailVerified: true,
                }).returning();
                console.log('✅ New Google user created:', user.email);
            }
            else {
                console.log('✅ Existing Google user logged in:', user.email);
            }
            const payload = { sub: user.id, email: user.email };
            return {
                access_token: await this.jwtService.signAsync(payload),
                user: {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name,
                    authProvider: user.authProvider || 'google',
                    emailVerified: user.emailVerified || true,
                },
            };
        }
        catch (error) {
            console.error('❌ Google login error:', error);
            throw new common_1.UnauthorizedException('Google authentication failed');
        }
    }
    async validateUser(userId) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (!user)
            return null;
        const { password, ...result } = user;
        return result;
    }
    async findAllUsers() {
        const allUsers = await db_1.db.select({
            id: schema_1.users.id,
            email: schema_1.users.email,
            name: schema_1.users.name,
            authProvider: schema_1.users.authProvider,
            emailVerified: schema_1.users.emailVerified,
            createdAt: schema_1.users.createdAt,
        }).from(schema_1.users);
        return allUsers;
    }
    async setPassword(userId, newPassword, confirmPassword, ipAddress, userAgent) {
        console.log('🔐 setPassword called with:', {
            userId,
            newPasswordLength: newPassword?.length || 0,
            confirmPasswordLength: confirmPassword?.length || 0,
            ipAddress,
        });
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.password && user.password.length > 0) {
            throw new common_1.BadRequestException('Password already set. Use change password instead.');
        }
        if (newPassword !== confirmPassword) {
            throw new common_1.BadRequestException('Passwords do not match');
        }
        this.validatePasswordStrength(newPassword);
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db_1.db.update(schema_1.users)
            .set({
            password: hashedPassword,
            lastPasswordChange: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        await this.securityLogService.log({
            userId,
            email: user.email,
            eventType: 'password_set',
            success: true,
            ipAddress,
            userAgent,
        });
        await (0, email_1.sendPasswordChangedEmail)(user.email, user.name);
        console.log('✅ Password set for user ID:', userId);
        return {
            message: 'Password set successfully. You can now login with email and password.',
        };
    }
    async hasPassword(userId) {
        const [user] = await db_1.db.select({ password: schema_1.users.password })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        return { hasPassword: user && user.password !== null && user.password.length > 0 };
    }
    async changePassword(userId, currentPassword, newPassword, confirmPassword, ipAddress, userAgent) {
        console.log('🔐 changePassword called with:', {
            userId,
            currentPasswordLength: currentPassword?.length || 0,
            newPasswordLength: newPassword?.length || 0,
            confirmPasswordLength: confirmPassword?.length || 0,
            ipAddress,
        });
        await this.rateLimitService.checkRateLimit(`user_${userId}`, 'password_change');
        const [user] = await db_1.db.select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (!user.password || user.password.length === 0) {
            throw new common_1.UnauthorizedException('No password set. Use set password instead.');
        }
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            await this.securityLogService.log({
                userId,
                email: user.email,
                eventType: 'password_change_failed',
                success: false,
                ipAddress,
                userAgent,
                metadata: { reason: 'Incorrect current password' },
            });
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        if (newPassword !== confirmPassword) {
            throw new common_1.BadRequestException('New passwords do not match');
        }
        this.validatePasswordStrength(newPassword);
        const isSameAsCurrentPassword = await bcrypt.compare(newPassword, user.password);
        if (isSameAsCurrentPassword) {
            await this.securityLogService.log({
                userId,
                email: user.email,
                eventType: 'password_change_failed',
                success: false,
                ipAddress,
                userAgent,
                metadata: { reason: 'New password same as current' },
            });
            throw new common_1.BadRequestException('New password must be different from current password');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db_1.db.update(schema_1.users)
            .set({
            password: hashedPassword,
            lastPasswordChange: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        await this.revokeAllUserSessions(userId);
        await this.securityLogService.log({
            userId,
            email: user.email,
            eventType: 'password_change',
            success: true,
            ipAddress,
            userAgent,
        });
        await this.rateLimitService.resetRateLimit(`user_${userId}`, 'password_change');
        await (0, email_1.sendPasswordChangedEmail)(user.email, user.name);
        console.log('✅ Password changed for user ID:', userId);
        return {
            message: 'Password changed successfully. All other sessions have been logged out.',
        };
    }
    validatePasswordStrength(password) {
        if (!password || typeof password !== 'string') {
            throw new common_1.BadRequestException('Password is required');
        }
        const trimmedPassword = password.trim();
        if (trimmedPassword.length === 0) {
            throw new common_1.BadRequestException('Password cannot be empty');
        }
        if (trimmedPassword.length < 8) {
            throw new common_1.BadRequestException('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            throw new common_1.BadRequestException('Password must contain at least one uppercase letter (A-Z)');
        }
        if (!/[a-z]/.test(password)) {
            throw new common_1.BadRequestException('Password must contain at least one lowercase letter (a-z)');
        }
        if (!/[0-9]/.test(password)) {
            throw new common_1.BadRequestException('Password must contain at least one number (0-9)');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            throw new common_1.BadRequestException('Password must contain at least one special character (!@#$%^&*)');
        }
        if (/\s/.test(password)) {
            throw new common_1.BadRequestException('Password must not contain spaces');
        }
    }
    async createSession(userId, token, ipAddress, deviceInfo) {
        try {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);
            await this.pool.query(`INSERT INTO active_sessions (user_id, token_hash, device_info, ip_address, expires_at)
         VALUES ($1, $2, $3, $4, $5)`, [userId, tokenHash, deviceInfo, ipAddress, expiresAt]);
        }
        catch (error) {
            console.error('Error creating session:', error);
        }
    }
    async revokeAllUserSessions(userId) {
        try {
            await this.pool.query(`UPDATE active_sessions 
         SET is_revoked = TRUE 
         WHERE user_id = $1 AND is_revoked = FALSE`, [userId]);
            console.log(`🔒 All sessions revoked for user ID: ${userId}`);
        }
        catch (error) {
            console.error('Error revoking sessions:', error);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        email_verification_service_1.EmailVerificationService,
        security_log_service_1.SecurityLogService,
        rate_limit_service_1.RateLimitService])
], AuthService);
//# sourceMappingURL=auth.service.js.map