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
exports.PasswordResetService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcrypt"));
const email_1 = require("../lib/email");
let PasswordResetService = class PasswordResetService {
    constructor() {
        this.pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }
    async forgotPassword(email) {
        try {
            const userResult = await this.pool.query('SELECT id, name, email, password FROM users WHERE email = $1', [email]);
            const user = userResult.rows[0];
            if (!user) {
                console.log(`⚠️ Password reset requested for non-existent email: ${email}`);
                return {
                    message: 'If an account exists with this email, a password reset link has been sent.',
                };
            }
            if (!user.password) {
                console.log(`⚠️ Password reset requested for OAuth-only account: ${email}`);
                return {
                    message: 'If an account exists with this email, a password reset link has been sent.',
                };
            }
            const resetToken = this.generateSecureToken();
            const hashedToken = await this.hashToken(resetToken);
            const expiresAt = this.getTokenExpiry(parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY || '1'));
            await this.createResetToken(user.id, hashedToken, expiresAt);
            await (0, email_1.sendPasswordResetEmail)(email, resetToken, user.name);
            console.log(`📧 Password reset email sent to ${email}`);
            return {
                message: 'If an account exists with this email, a password reset link has been sent.',
            };
        }
        catch (error) {
            console.error('Error in forgotPassword:', error);
            throw new common_1.BadRequestException('Failed to process password reset request');
        }
    }
    async resetPassword(token, newPassword) {
        try {
            this.validatePasswordStrength(newPassword);
            const hashedToken = await this.hashToken(token);
            const tokenData = await this.validateResetToken(hashedToken);
            if (!tokenData) {
                throw new common_1.UnauthorizedException('Invalid or expired reset token');
            }
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            await this.pool.query(`UPDATE users 
         SET password = $1, 
             last_password_change = NOW(),
             updated_at = NOW() 
         WHERE id = $2`, [hashedPassword, tokenData.user_id]);
            await this.markTokenAsUsed(hashedToken);
            await this.revokeAllUserSessions(tokenData.user_id);
            console.log(`✅ Password reset successful for user ID: ${tokenData.user_id}`);
            return {
                message: 'Password reset successful. You can now log in with your new password.',
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error('Error in resetPassword:', error);
            throw new common_1.BadRequestException('Failed to reset password');
        }
    }
    async hasActiveResetToken(userId) {
        try {
            const result = await this.pool.query(`SELECT COUNT(*) as count 
         FROM password_reset_tokens 
         WHERE user_id = $1 
         AND used_at IS NULL 
         AND expires_at > NOW()`, [userId]);
            return parseInt(result.rows[0]?.count || '0') > 0;
        }
        catch (error) {
            console.error('Error checking active reset token:', error);
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
    async createResetToken(userId, hashedToken, expiresAt) {
        await this.pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [userId]);
        await this.pool.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, hashedToken, expiresAt]);
    }
    async validateResetToken(hashedToken) {
        const result = await this.pool.query(`SELECT prt.*, u.id as user_id, u.email 
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1 
       AND prt.used_at IS NULL 
       AND prt.expires_at > NOW()`, [hashedToken]);
        return result.rows[0] || null;
    }
    async markTokenAsUsed(hashedToken) {
        await this.pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1', [hashedToken]);
    }
    async revokeAllUserSessions(userId) {
        try {
            await this.pool.query(`UPDATE active_sessions 
         SET is_revoked = TRUE 
         WHERE user_id = $1 AND is_revoked = FALSE`, [userId]);
            console.log(`🔒 All sessions revoked for user ID: ${userId} (password reset)`);
        }
        catch (error) {
            console.error('Error revoking sessions:', error);
        }
    }
    validatePasswordStrength(password) {
        if (password.length < 8) {
            throw new common_1.BadRequestException('Password must be at least 8 characters long');
        }
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
            throw new common_1.BadRequestException('Password must contain at least one uppercase letter, one lowercase letter, and one number');
        }
    }
    async cleanup() {
        try {
            await this.pool.query(`DELETE FROM password_reset_tokens 
         WHERE expires_at < NOW() - INTERVAL '7 days'`);
            console.log('🧹 Password reset tokens cleanup completed');
        }
        catch (error) {
            console.error('Error cleaning up password reset tokens:', error);
        }
    }
};
exports.PasswordResetService = PasswordResetService;
exports.PasswordResetService = PasswordResetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PasswordResetService);
//# sourceMappingURL=password-reset.service.js.map