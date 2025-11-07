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
exports.GoogleOAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const google_auth_library_1 = require("google-auth-library");
const pg_1 = require("pg");
const crypto = __importStar(require("crypto"));
const email_1 = require("../lib/email");
const security_log_service_1 = require("./security-log.service");
let GoogleOAuthService = class GoogleOAuthService {
    constructor(configService, securityLogService) {
        this.configService = configService;
        this.securityLogService = securityLogService;
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        if (!clientId) {
            throw new Error('GOOGLE_CLIENT_ID is not configured');
        }
        this.client = new google_auth_library_1.OAuth2Client(clientId);
        this.pool = new pg_1.Pool({
            connectionString: this.configService.get('DATABASE_URL'),
        });
        console.log('🔐 GoogleOAuthService initialized');
    }
    async validateIdToken(idToken, ipAddress) {
        try {
            console.log('🔍 Validating Google ID token...');
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: this.configService.get('GOOGLE_CLIENT_ID'),
            });
            const payload = ticket.getPayload();
            if (!payload) {
                await this.securityLogService.log({
                    eventType: 'oauth_validation_failed',
                    success: false,
                    metadata: { reason: 'Empty payload', provider: 'google' },
                    ipAddress,
                });
                throw new common_1.UnauthorizedException('Invalid token payload');
            }
            if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
                await this.securityLogService.log({
                    eventType: 'oauth_validation_failed',
                    success: false,
                    metadata: { reason: 'Invalid issuer', issuer: payload.iss, provider: 'google' },
                    ipAddress,
                });
                throw new common_1.UnauthorizedException('Invalid token issuer');
            }
            const clientId = this.configService.get('GOOGLE_CLIENT_ID');
            if (payload.aud !== clientId) {
                await this.securityLogService.log({
                    eventType: 'oauth_validation_failed',
                    success: false,
                    metadata: { reason: 'Invalid audience', provider: 'google' },
                    ipAddress,
                });
                throw new common_1.UnauthorizedException('Invalid token audience');
            }
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                await this.securityLogService.log({
                    eventType: 'oauth_validation_failed',
                    success: false,
                    metadata: { reason: 'Token expired', provider: 'google' },
                    ipAddress,
                });
                throw new common_1.UnauthorizedException('Token has expired');
            }
            if (payload.iat && payload.iat > now + 300) {
                await this.securityLogService.log({
                    eventType: 'oauth_validation_failed',
                    success: false,
                    metadata: { reason: 'Invalid issued time', provider: 'google' },
                    ipAddress,
                });
                throw new common_1.UnauthorizedException('Invalid token issued time');
            }
            if (!payload.email) {
                throw new common_1.UnauthorizedException('Email not found in token');
            }
            console.log('✅ Google ID token validated successfully:', payload.email);
            return {
                email: payload.email,
                email_verified: payload.email_verified || false,
                name: payload.name || 'User',
                picture: payload.picture,
                sub: payload.sub,
                iat: payload.iat || now,
                exp: payload.exp || now + 3600,
                aud: payload.aud,
                iss: payload.iss,
            };
        }
        catch (error) {
            console.error('❌ Google ID token validation error:', error);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            await this.securityLogService.log({
                eventType: 'oauth_validation_failed',
                success: false,
                metadata: { reason: error.message, provider: 'google' },
                ipAddress,
            });
            throw new common_1.UnauthorizedException('Failed to validate Google token');
        }
    }
    async handleGoogleAuthPassport(googleData, ipAddress, userAgent) {
        console.log('='.repeat(80));
        console.log('🔐 GOOGLE AUTH REQUEST (PASSPORT)');
        console.log('='.repeat(80));
        console.log('👤 Google User:', googleData);
        const existingUser = await this.findUserByEmail(googleData.email);
        if (!existingUser) {
            console.log('❌ No account found - user must register first');
            await this.securityLogService.log({
                email: googleData.email,
                eventType: 'google_login_no_account',
                success: false,
                ipAddress,
                userAgent,
                metadata: {
                    provider: 'google',
                    reason: 'No account exists',
                },
            });
            console.log('='.repeat(80));
            return {
                status: 'no_account',
                message: 'No account found with this email. Please register first by clicking "Continue with Google" on the registration page.',
                requiresAction: 'register_required',
            };
        }
        console.log('✅ Existing user found - sending verification email for security');
        const tempRegistration = await this.findTemporaryRegistration(googleData.googleId);
        if (tempRegistration) {
            console.log('📧 Temporary registration found - resending verification');
            return await this.handlePendingRegistration(tempRegistration, {
                email: googleData.email,
                name: googleData.name,
                picture: googleData.picture,
                sub: googleData.googleId,
                email_verified: false,
                iat: 0,
                exp: 0,
                aud: '',
                iss: '',
            }, ipAddress, userAgent);
        }
        console.log('📧 Creating verification request for existing user');
        const verificationToken = this.generateSecureToken();
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const registrationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.createTemporaryRegistration({
            email: googleData.email,
            name: googleData.name,
            googleId: googleData.googleId,
            googleEmail: googleData.email,
            googleName: googleData.name,
            googlePicture: googleData.picture,
            verificationToken,
            tokenExpiresAt,
            expiresAt: registrationExpiresAt,
        });
        await (0, email_1.sendGoogleVerificationEmail)(googleData.email, verificationToken, googleData.name);
        await this.securityLogService.log({
            userId: existingUser.id,
            email: existingUser.email,
            eventType: 'google_verification_sent',
            success: true,
            ipAddress,
            userAgent,
            metadata: {
                provider: 'google',
                reason: 'Security verification required',
            },
        });
        console.log('✅ Verification email sent to existing user');
        console.log('='.repeat(80));
        return {
            status: 'pending_verification',
            message: 'For security, please verify your email. Check your inbox to continue.',
            requiresAction: 'verify_email',
        };
    }
    async handleGoogleAuth(idToken, ipAddress, userAgent) {
        console.log('='.repeat(80));
        console.log('🔐 GOOGLE AUTH REQUEST');
        console.log('='.repeat(80));
        const googleUser = await this.validateIdToken(idToken, ipAddress);
        console.log('👤 Google User:', {
            email: googleUser.email,
            name: googleUser.name,
            sub: googleUser.sub,
            emailVerified: googleUser.email_verified,
        });
        const existingUser = await this.findUserByEmail(googleUser.email);
        if (existingUser) {
            console.log('✅ Existing user found in users table');
            return await this.handleExistingUser(existingUser, googleUser, ipAddress, userAgent);
        }
        const tempRegistration = await this.findTemporaryRegistration(googleUser.sub);
        if (tempRegistration) {
            console.log('📧 Temporary registration found - resending verification');
            return await this.handlePendingRegistration(tempRegistration, googleUser, ipAddress, userAgent);
        }
        console.log('🆕 Creating new temporary registration');
        return await this.handleNewUser(googleUser, ipAddress, userAgent);
    }
    async handleExistingUser(existingUser, googleUser, ipAddress, userAgent) {
        console.log('🔍 Checking existing user auth provider...');
        if (existingUser.auth_provider === 'email' && existingUser.password) {
            await this.securityLogService.log({
                userId: existingUser.id,
                email: existingUser.email,
                eventType: 'oauth_conflict',
                success: false,
                ipAddress,
                userAgent,
                metadata: {
                    reason: 'Email already registered with password',
                    provider: 'google',
                },
            });
            console.log('❌ Google login blocked: Email already registered with password');
            console.log('='.repeat(80));
            throw new common_1.ConflictException({
                statusCode: 409,
                message: 'This email is already registered with a password. Please sign in using your email and password instead.',
                error: 'Conflict',
                action: 'use_email_password',
                email: existingUser.email,
            });
        }
        const oauthAccount = await this.findOAuthAccount('google', googleUser.sub);
        if (!oauthAccount) {
            console.log('🔗 Linking OAuth account to existing user');
            await this.linkOAuthAccount(existingUser.id, googleUser);
        }
        await this.pool.query('UPDATE users SET updated_at = NOW() WHERE id = $1', [existingUser.id]);
        await this.securityLogService.log({
            userId: existingUser.id,
            email: existingUser.email,
            eventType: 'google_login',
            success: true,
            ipAddress,
            userAgent,
            metadata: { provider: 'google' },
        });
        console.log('✅ Existing Google user logged in:', existingUser.email);
        console.log('='.repeat(80));
        return {
            status: 'existing',
            user: {
                id: existingUser.id,
                email: existingUser.email,
                name: existingUser.name,
                emailVerified: existingUser.email_verified,
                authProvider: 'google',
            },
        };
    }
    async handlePendingRegistration(tempRegistration, googleUser, ipAddress, userAgent) {
        console.log('📧 Temporary registration exists:', {
            id: tempRegistration.id,
            email: tempRegistration.email,
            attempts: tempRegistration.attempts,
        });
        await this.updateTemporaryRegistrationAttempt(tempRegistration.id);
        await (0, email_1.sendGoogleVerificationEmail)(tempRegistration.email, tempRegistration.verification_token, tempRegistration.name);
        await this.securityLogService.log({
            email: tempRegistration.email,
            eventType: 'google_verification_resent',
            success: true,
            ipAddress,
            userAgent,
            metadata: {
                provider: 'google',
                attempts: tempRegistration.attempts + 1,
            },
        });
        console.log('✅ Verification email resent');
        console.log('='.repeat(80));
        return {
            status: 'pending_verification',
            message: 'Verification email resent. Please check your inbox to complete registration.',
            requiresAction: 'verify_email',
        };
    }
    async handleNewUser(googleUser, ipAddress, userAgent) {
        console.log('🆕 Creating new temporary registration for:', googleUser.email);
        const verificationToken = this.generateSecureToken();
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const registrationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        console.log('🔑 Verification token generated:', verificationToken.substring(0, 20) + '...');
        await this.createTemporaryRegistration({
            email: googleUser.email,
            name: googleUser.name,
            googleId: googleUser.sub,
            googleEmail: googleUser.email,
            googleName: googleUser.name,
            googlePicture: googleUser.picture,
            verificationToken,
            tokenExpiresAt,
            expiresAt: registrationExpiresAt,
        });
        console.log('✅ Temporary registration created');
        console.log('📧 Sending verification email...');
        await (0, email_1.sendGoogleVerificationEmail)(googleUser.email, verificationToken, googleUser.name);
        await this.securityLogService.log({
            email: googleUser.email,
            eventType: 'google_register_pending',
            success: true,
            ipAddress,
            userAgent,
            metadata: {
                provider: 'google',
                emailVerified: false,
                pendingVerification: true,
            },
        });
        console.log('✅ New Google user - verification email sent');
        console.log('='.repeat(80));
        return {
            status: 'pending_verification',
            message: 'Account created successfully! Please check your email to verify your account before continuing.',
            requiresAction: 'verify_email',
        };
    }
    async startRegistrationFromPassport(googleData, ipAddress, userAgent) {
        const verificationToken = this.generateSecureToken();
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const registrationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.createTemporaryRegistration({
            email: googleData.email,
            name: googleData.name,
            googleId: googleData.googleId,
            googleEmail: googleData.email,
            googleName: googleData.name,
            googlePicture: googleData.picture,
            verificationToken,
            tokenExpiresAt,
            expiresAt: registrationExpiresAt,
        });
        await (0, email_1.sendGoogleVerificationEmail)(googleData.email, verificationToken, googleData.name);
        await this.securityLogService.log({
            email: googleData.email,
            eventType: 'google_register_pending',
            success: true,
            ipAddress,
            userAgent,
            metadata: { provider: 'google', emailVerified: false, pendingVerification: true, source: 'register_flow' },
        });
        return {
            status: 'pending_verification',
            message: 'Account created successfully! Please check your email to verify your account before continuing.',
            requiresAction: 'verify_email',
        };
    }
    async verifyGoogleUser(token, ipAddress, userAgent) {
        try {
            console.log('='.repeat(80));
            console.log('🔍 VERIFYING GOOGLE USER');
            console.log('='.repeat(80));
            console.log('🔑 Token:', token.substring(0, 20) + '...');
            if (!token || token.length < 32) {
                throw new common_1.BadRequestException('Invalid verification token format');
            }
            const tempReg = await this.pool.query(`SELECT * FROM temporary_registrations 
         WHERE verification_token = $1 
         AND token_expires_at > NOW()`, [token]);
            if (tempReg.rows.length === 0) {
                console.error('❌ Invalid or expired token');
                const expiredCheck = await this.pool.query(`SELECT token_expires_at, email FROM temporary_registrations 
           WHERE verification_token = $1`, [token]);
                if (expiredCheck.rows.length > 0) {
                    console.error('❌ Token expired at:', expiredCheck.rows[0].token_expires_at);
                }
                throw new common_1.BadRequestException('Invalid or expired verification token');
            }
            const registration = tempReg.rows[0];
            console.log('✅ Valid temporary registration found:', registration.email);
            const existingUser = await this.findUserByEmail(registration.email);
            if (existingUser) {
                console.log('✅ User already exists - completing verification for existing user');
                if (!existingUser.email_verified) {
                    await this.pool.query('UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1', [existingUser.id]);
                }
                const oauthAccount = await this.findOAuthAccount('google', registration.google_id);
                if (!oauthAccount) {
                    await this.linkOAuthAccount(existingUser.id, {
                        sub: registration.google_id,
                        email: registration.google_email,
                        name: registration.google_name,
                        picture: registration.google_picture,
                        email_verified: true,
                        iat: 0,
                        exp: 0,
                        aud: '',
                        iss: '',
                    });
                }
                await this.deleteTemporaryRegistration(registration.id);
                await this.securityLogService.log({
                    userId: existingUser.id,
                    email: existingUser.email,
                    eventType: 'google_email_verified',
                    success: true,
                    ipAddress,
                    userAgent,
                    metadata: { provider: 'google', type: 'existing_user' },
                });
                return {
                    success: true,
                    email: existingUser.email,
                    user: {
                        id: existingUser.id.toString(),
                        email: existingUser.email,
                        name: existingUser.name,
                        emailVerified: true,
                        authProvider: 'google',
                    },
                };
            }
            console.log('📝 Creating verified user account...');
            const newUser = await this.createVerifiedUserFromTemp(registration);
            console.log('✅ User created:', newUser.email);
            console.log('🗑️ Deleting temporary registration...');
            await this.deleteTemporaryRegistration(registration.id);
            await this.securityLogService.log({
                userId: newUser.id,
                email: newUser.email,
                eventType: 'google_email_verified',
                success: true,
                ipAddress,
                userAgent,
                metadata: { provider: 'google', type: 'new_user' },
            });
            console.log('✅ Google user verified and created successfully');
            console.log('='.repeat(80));
            return {
                success: true,
                email: newUser.email,
                user: {
                    id: newUser.id.toString(),
                    email: newUser.email,
                    name: newUser.name,
                    emailVerified: true,
                    authProvider: 'google',
                },
            };
        }
        catch (error) {
            console.error('❌ Error verifying Google user:', error);
            console.error('='.repeat(80));
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to verify Google user: ' + error.message);
        }
    }
    generateSecureToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    async findUserByEmail(email) {
        const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }
    async findUserByGoogleId(googleId) {
        const result = await this.pool.query('SELECT * FROM users WHERE google_id = $1 AND email_verified = TRUE', [googleId]);
        return result.rows[0] || null;
    }
    async findOAuthAccount(provider, providerUserId) {
        const result = await this.pool.query('SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2', [provider, providerUserId]);
        return result.rows[0] || null;
    }
    async linkOAuthAccount(userId, googleUser) {
        await this.pool.query(`INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (provider, provider_user_id) 
       DO UPDATE SET email = $4, email_verified = $5, updated_at = NOW()`, [userId, 'google', googleUser.sub, googleUser.email, googleUser.email_verified]);
    }
    async findTemporaryRegistration(googleId) {
        const result = await this.pool.query(`SELECT * FROM temporary_registrations 
       WHERE google_id = $1 
       AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`, [googleId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    async createTemporaryRegistration(data) {
        await this.pool.query(`INSERT INTO temporary_registrations 
       (email, name, google_id, google_email, google_name, google_picture, 
        verification_token, token_expires_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            data.email,
            data.name,
            data.googleId,
            data.googleEmail,
            data.googleName,
            data.googlePicture || null,
            data.verificationToken,
            data.tokenExpiresAt,
            data.expiresAt,
        ]);
    }
    async updateTemporaryRegistrationAttempt(id) {
        await this.pool.query(`UPDATE temporary_registrations 
       SET attempts = attempts + 1,
           last_attempt_at = NOW()
       WHERE id = $1`, [id]);
    }
    async deleteTemporaryRegistration(id) {
        await this.pool.query('DELETE FROM temporary_registrations WHERE id = $1', [id]);
    }
    async createVerifiedUserFromTemp(registration) {
        const result = await this.pool.query(`INSERT INTO users (email, name, google_id, auth_provider, email_verified, password)
       VALUES ($1, $2, $3, 'google', TRUE, NULL)
       RETURNING id, email, name, email_verified, auth_provider`, [registration.email, registration.name, registration.google_id]);
        const user = result.rows[0];
        await this.linkOAuthAccount(user.id, {
            sub: registration.google_id,
            email: registration.google_email,
            name: registration.google_name,
            email_verified: true,
            picture: registration.google_picture,
            iat: 0,
            exp: 0,
            aud: '',
            iss: '',
        });
        return user;
    }
    async cleanupExpiredRegistrations() {
        try {
            console.log('🧹 Cleaning up expired temporary registrations...');
            const result = await this.pool.query('DELETE FROM temporary_registrations WHERE expires_at < NOW() RETURNING id, email');
            if (result.rowCount > 0) {
                console.log(`✅ Cleaned up ${result.rowCount} expired registrations`);
            }
        }
        catch (error) {
            console.error('❌ Error cleaning up temporary registrations:', error);
        }
    }
};
exports.GoogleOAuthService = GoogleOAuthService;
exports.GoogleOAuthService = GoogleOAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        security_log_service_1.SecurityLogService])
], GoogleOAuthService);
//# sourceMappingURL=google-oauth.service.js.map