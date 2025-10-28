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
exports.EmailVerificationService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const pg_1 = require("pg");
const crypto = __importStar(require("crypto"));
const email_1 = require("../lib/email");
let EmailVerificationService = class EmailVerificationService {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }
    async sendVerificationEmail(userId, email, name) {
        try {
            const verificationToken = this.generateSecureToken();
            const expiresAt = this.getTokenExpiry(24);
            const hashedToken = await this.hashToken(verificationToken);
            await this.createVerificationToken(userId, hashedToken, expiresAt);
            await (0, email_1.sendEmailVerificationEmail)(email, verificationToken, name);
            console.log(`📧 Verification email sent to ${email}`);
        }
        catch (error) {
            console.error('Error sending verification email:', error);
            throw new common_1.BadRequestException('Failed to send verification email');
        }
    }
    async resendVerificationEmail(userId) {
        try {
            const userResult = await this.pool.query('SELECT email, name, email_verified FROM users WHERE id = $1', [userId]);
            const user = userResult.rows[0];
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            if (user.email_verified) {
                throw new common_1.BadRequestException('Email already verified');
            }
            const recentTokenResult = await this.pool.query(`SELECT created_at FROM email_verification_tokens 
         WHERE user_id = $1 
         AND created_at > NOW() - INTERVAL '2 minutes'
         ORDER BY created_at DESC LIMIT 1`, [userId]);
            if (recentTokenResult.rows.length > 0) {
                throw new common_1.BadRequestException('Please wait before requesting another verification email');
            }
            await this.sendVerificationEmail(userId, user.email, user.name);
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error('Error resending verification email:', error);
            throw new common_1.BadRequestException('Failed to resend verification email');
        }
    }
    async verifyEmailAndGenerateToken(token) {
        try {
            console.log('🔍 EmailVerificationService: Verifying token:', token.substring(0, 20) + '...');
            const hashedToken = await this.hashToken(token);
            console.log('🔐 Hashed token for lookup:', hashedToken.substring(0, 20) + '...');
            const tokenData = await this.validateVerificationToken(hashedToken);
            if (!tokenData) {
                console.error('❌ Token validation failed - not found or expired');
                throw new common_1.BadRequestException('Invalid or expired verification token');
            }
            console.log('✅ Token valid for user:', tokenData.email);
            await this.markEmailAsVerified(tokenData.user_id);
            console.log('✅ Email marked as verified');
            await this.markTokenAsUsed(hashedToken);
            console.log('✅ Token marked as used');
            const userData = await this.getUserData(tokenData.user_id);
            console.log('✅ User data retrieved:', userData.email);
            const payload = { sub: userData.id, email: userData.email };
            const accessToken = await this.jwtService.signAsync(payload);
            console.log('✅ JWT token generated');
            return {
                success: true,
                email: userData.email,
                access_token: accessToken,
                user: {
                    id: userData.id.toString(),
                    email: userData.email,
                    name: userData.name,
                    emailVerified: true,
                    authProvider: userData.auth_provider || 'email',
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error('❌ Email verification error:', error);
            throw new common_1.BadRequestException('Failed to verify email');
        }
    }
    async verifyEmail(token) {
        try {
            const hashedToken = await this.hashToken(token);
            const tokenData = await this.validateVerificationToken(hashedToken);
            if (!tokenData) {
                throw new common_1.BadRequestException('Invalid or expired verification token');
            }
            await this.markEmailAsVerified(tokenData.user_id);
            await this.markTokenAsUsed(hashedToken);
            console.log(`✅ Email verified for user ID: ${tokenData.user_id}`);
            return {
                userId: tokenData.user_id,
                email: tokenData.email,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error('Email verification error:', error);
            throw new common_1.BadRequestException('Failed to verify email');
        }
    }
    async isEmailVerified(userId) {
        try {
            const result = await this.pool.query('SELECT email_verified FROM users WHERE id = $1', [userId]);
            return result.rows[0]?.email_verified || false;
        }
        catch (error) {
            console.error('Error checking email verification:', error);
            return false;
        }
    }
    async hasPendingVerification(userId) {
        try {
            const result = await this.pool.query(`SELECT COUNT(*) as count 
         FROM email_verification_tokens 
         WHERE user_id = $1 
         AND used_at IS NULL 
         AND expires_at > NOW()`, [userId]);
            return parseInt(result.rows[0]?.count || '0') > 0;
        }
        catch (error) {
            console.error('Error checking pending verification:', error);
            return false;
        }
    }
    generateSecureToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    async hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    getTokenExpiry(hours) {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + hours);
        return expiry;
    }
    async createVerificationToken(userId, hashedToken, expiresAt) {
        await this.pool.query('UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [userId]);
        await this.pool.query('INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, hashedToken, expiresAt]);
    }
    async validateVerificationToken(hashedToken) {
        const result = await this.pool.query(`SELECT evt.*, u.email, u.id as user_id, u.name, u.auth_provider
       FROM email_verification_tokens evt
       JOIN users u ON u.id = evt.user_id
       WHERE evt.token = $1 
       AND evt.used_at IS NULL 
       AND evt.expires_at > NOW()`, [hashedToken]);
        return result.rows[0] || null;
    }
    async markEmailAsVerified(userId) {
        await this.pool.query('UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1', [userId]);
    }
    async markTokenAsUsed(hashedToken) {
        await this.pool.query('UPDATE email_verification_tokens SET used_at = NOW() WHERE token = $1', [hashedToken]);
    }
    async getUserData(userId) {
        const result = await this.pool.query('SELECT id, email, name, email_verified, auth_provider FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            throw new common_1.BadRequestException('User not found');
        }
        return result.rows[0];
    }
};
exports.EmailVerificationService = EmailVerificationService;
exports.EmailVerificationService = EmailVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], EmailVerificationService);
//# sourceMappingURL=email-verification.service.js.map