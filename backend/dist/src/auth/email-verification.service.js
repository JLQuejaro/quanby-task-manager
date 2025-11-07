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
            console.log(`📧 Preparing to send verification email to ${email} (User ID: ${userId})`);
            const verificationToken = this.generateSecureToken();
            const expiresAt = this.getTokenExpiry(24);
            const hashedToken = await this.hashToken(verificationToken);
            await this.createVerificationToken(userId, hashedToken, expiresAt);
            await (0, email_1.sendEmailVerificationEmail)(email, verificationToken, name);
            console.log(`✅ Verification email sent to ${email}`);
        }
        catch (error) {
            console.error('❌ Error sending verification email:', error);
            console.error('❌ Error details:', error.message);
            throw new common_1.BadRequestException('Failed to send verification email: ' + error.message);
        }
    }
    async resendVerificationEmail(userId, force = false) {
        try {
            console.log(`🔄 Resending verification email for user ID: ${userId} ${force ? '(force)' : ''}`);
            const userResult = await this.pool.query(`SELECT 
          id,
          email, 
          name, 
          email_verified as is_verified
         FROM users 
         WHERE id = $1`, [userId]);
            if (userResult.rows.length === 0) {
                console.error(`❌ User not found: ${userId}`);
                throw new common_1.BadRequestException('User not found');
            }
            const user = userResult.rows[0];
            console.log(`👤 Found user: ${user.email}`);
            if (user.is_verified && !force) {
                console.log(`✅ Email already verified for: ${user.email}`);
                throw new common_1.BadRequestException('Email already verified');
            }
            const recentTokenResult = await this.pool.query(`SELECT created_at
         FROM email_verification_tokens 
         WHERE user_id = $1 
         AND created_at > NOW() - INTERVAL '2 minutes'
         ORDER BY created_at DESC 
         LIMIT 1`, [userId]);
            if (recentTokenResult.rows.length > 0) {
                console.log(`⏱️ Recent verification email already sent to: ${user.email}`);
                throw new common_1.BadRequestException('Please wait 2 minutes before requesting another verification email');
            }
            console.log(`📤 Sending new verification email to: ${user.email}`);
            await this.sendVerificationEmail(userId, user.email, user.name);
            console.log(`✅ Verification email resent successfully to: ${user.email}`);
        }
        catch (error) {
            console.error('❌ Error in resendVerificationEmail:', error);
            console.error('❌ Error stack:', error.stack);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to resend verification email: ' + error.message);
        }
    }
    async verifyEmailAndGenerateToken(token) {
        try {
            console.log('🔍 EmailVerificationService: Verifying token:', token.substring(0, 20) + '...');
            if (!token || token.length < 32) {
                console.error('❌ Invalid token format');
                throw new common_1.BadRequestException('Invalid verification token format');
            }
            const hashedToken = await this.hashToken(token);
            console.log('🔐 Hashed token for lookup:', hashedToken.substring(0, 20) + '...');
            const tokenData = await this.validateVerificationToken(hashedToken);
            if (!tokenData) {
                console.error('❌ Token validation failed - checking if already verified...');
                const usedTokenCheck = await this.checkIfTokenAlreadyUsed(hashedToken);
                if (usedTokenCheck && usedTokenCheck.emailVerified) {
                    console.log('✅ Token already used but user is verified - returning success');
                    const userData = await this.getUserData(usedTokenCheck.userId);
                    const payload = { sub: userData.id, email: userData.email };
                    const accessToken = await this.jwtService.signAsync(payload);
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
            console.error('❌ Email verification error:', error);
            console.error('❌ Error stack:', error.stack);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to verify email: ' + error.message);
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
            console.error('❌ Email verification error:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to verify email: ' + error.message);
        }
    }
    async isEmailVerified(userId) {
        try {
            const result = await this.pool.query('SELECT email_verified FROM users WHERE id = $1', [userId]);
            return result.rows[0]?.email_verified || false;
        }
        catch (error) {
            console.error('❌ Error checking email verification:', error);
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
            console.error('❌ Error checking pending verification:', error);
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
        try {
            console.log(`💾 Creating verification token for user ID: ${userId}`);
            const invalidateResult = await this.pool.query('UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [userId]);
            console.log(`🔄 Invalidated ${invalidateResult.rowCount} old tokens`);
            const insertResult = await this.pool.query('INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id', [userId, hashedToken, expiresAt]);
            console.log(`✅ Created new verification token with ID: ${insertResult.rows[0].id}`);
        }
        catch (error) {
            console.error('❌ Error creating verification token:', error);
            console.error('❌ Error details:', error.message);
            throw new common_1.BadRequestException('Failed to create verification token: ' + error.message);
        }
    }
    async validateVerificationToken(hashedToken) {
        try {
            console.log('🔍 Validating token in database...');
            const result = await this.pool.query(`SELECT 
          evt.*, 
          u.email, 
          u.id as user_id, 
          u.name, 
          u.auth_provider
         FROM email_verification_tokens evt
         JOIN users u ON u.id = evt.user_id
         WHERE evt.token = $1 
         AND evt.used_at IS NULL 
         AND evt.expires_at > NOW()`, [hashedToken]);
            if (result.rows.length === 0) {
                console.log('❌ No matching token found in database');
                const expiredCheck = await this.pool.query(`SELECT 
            evt.expires_at, 
            evt.used_at,
            u.email
           FROM email_verification_tokens evt
           JOIN users u ON u.id = evt.user_id
           WHERE evt.token = $1`, [hashedToken]);
                if (expiredCheck.rows.length > 0) {
                    const tokenInfo = expiredCheck.rows[0];
                    if (tokenInfo.used_at) {
                        console.log('❌ Token already used');
                    }
                    else if (new Date(tokenInfo.expires_at) < new Date()) {
                        console.log('❌ Token expired at:', tokenInfo.expires_at);
                    }
                }
                else {
                    console.log('❌ Token does not exist in database at all');
                }
                return null;
            }
            console.log('✅ Token found in database for user:', result.rows[0].email);
            return result.rows[0];
        }
        catch (error) {
            console.error('❌ Error validating token:', error);
            console.error('❌ Error details:', error.message);
            throw error;
        }
    }
    async checkIfTokenAlreadyUsed(hashedToken) {
        try {
            const result = await this.pool.query(`SELECT 
          evt.user_id,
          u.email_verified
         FROM email_verification_tokens evt
         JOIN users u ON u.id = evt.user_id
         WHERE evt.token = $1
         AND evt.used_at IS NOT NULL`, [hashedToken]);
            if (result.rows.length === 0) {
                return null;
            }
            return {
                userId: result.rows[0].user_id,
                emailVerified: result.rows[0].email_verified,
            };
        }
        catch (error) {
            console.error('❌ Error checking if token already used:', error);
            return null;
        }
    }
    async markEmailAsVerified(userId) {
        try {
            console.log(`📝 Marking email as verified for user ID: ${userId}`);
            const result = await this.pool.query(`UPDATE users 
         SET email_verified = TRUE,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, email`, [userId]);
            if (result.rowCount === 0) {
                throw new common_1.BadRequestException('User not found');
            }
            console.log(`✅ Email verified for user: ${result.rows[0].email}`);
        }
        catch (error) {
            console.error('❌ Error marking email as verified:', error);
            console.error('❌ Error details:', error.message);
            throw error;
        }
    }
    async markTokenAsUsed(hashedToken) {
        try {
            console.log('🔒 Marking token as used...');
            const result = await this.pool.query('UPDATE email_verification_tokens SET used_at = NOW() WHERE token = $1 RETURNING id', [hashedToken]);
            if (result.rowCount > 0) {
                console.log(`✅ Token marked as used (ID: ${result.rows[0].id})`);
            }
            else {
                console.log('⚠️ Token not found when marking as used');
            }
        }
        catch (error) {
            console.error('❌ Error marking token as used:', error);
            throw error;
        }
    }
    async getUserData(userId) {
        try {
            console.log(`👤 Fetching user data for ID: ${userId}`);
            const result = await this.pool.query(`SELECT 
          id, 
          email, 
          name, 
          email_verified,
          auth_provider
         FROM users 
         WHERE id = $1`, [userId]);
            if (result.rows.length === 0) {
                console.error('❌ User not found:', userId);
                throw new common_1.BadRequestException('User not found');
            }
            console.log('✅ User data fetched:', result.rows[0].email);
            return result.rows[0];
        }
        catch (error) {
            console.error('❌ Error fetching user data:', error);
            throw error;
        }
    }
};
exports.EmailVerificationService = EmailVerificationService;
exports.EmailVerificationService = EmailVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], EmailVerificationService);
//# sourceMappingURL=email-verification.service.js.map