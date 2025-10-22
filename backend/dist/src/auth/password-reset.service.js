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
const bcrypt = __importStar(require("bcryptjs"));
const tokens_1 = require("../lib/tokens");
const email_1 = require("../lib/email");
let PasswordResetService = class PasswordResetService {
    constructor() {
        this.pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }
    async forgotPassword(email) {
        try {
            const user = await this.getUserByEmail(email.toLowerCase());
            if (!user) {
                return {
                    message: 'If an account exists with this email, a reset link has been sent.',
                };
            }
            const resetToken = (0, tokens_1.generateResetToken)();
            const expiresAt = (0, tokens_1.getTokenExpiry)();
            await this.createPasswordResetToken(user.id, resetToken, expiresAt);
            await (0, email_1.sendPasswordResetEmail)(user.email, resetToken, user.name);
            return {
                message: 'If an account exists with this email, a reset link has been sent.',
            };
        }
        catch (error) {
            console.error('Forgot password error:', error);
            throw new common_1.InternalServerErrorException('An error occurred. Please try again later.');
        }
    }
    async resetPassword(token, newPassword) {
        try {
            const tokenData = await this.validateResetToken(token);
            if (!tokenData) {
                throw new common_1.BadRequestException('Invalid or expired reset token');
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await this.updateUserPassword(tokenData.user_id, hashedPassword);
            await this.markTokenAsUsed(token);
            return { message: 'Password has been reset successfully' };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error('Reset password error:', error);
            throw new common_1.InternalServerErrorException('An error occurred. Please try again later.');
        }
    }
    async createPasswordResetToken(userId, token, expiresAt) {
        await this.pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [userId]);
        await this.pool.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, token, expiresAt]);
    }
    async validateResetToken(token) {
        const result = await this.pool.query(`SELECT prt.*, u.email, u.id as user_id, u.name 
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1 
       AND prt.used_at IS NULL 
       AND prt.expires_at > NOW()`, [token]);
        return result.rows[0] || null;
    }
    async markTokenAsUsed(token) {
        await this.pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1', [token]);
    }
    async getUserByEmail(email) {
        const result = await this.pool.query('SELECT id, email, name FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }
    async updateUserPassword(userId, hashedPassword) {
        await this.pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
    }
};
exports.PasswordResetService = PasswordResetService;
exports.PasswordResetService = PasswordResetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PasswordResetService);
//# sourceMappingURL=password-reset.service.js.map