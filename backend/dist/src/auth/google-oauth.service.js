"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleOAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const google_auth_library_1 = require("google-auth-library");
const pg_1 = require("pg");
const email_verification_service_1 = require("./email-verification.service");
const security_log_service_1 = require("./security-log.service");
let GoogleOAuthService = class GoogleOAuthService {
    constructor(configService, emailVerificationService, securityLogService) {
        this.configService = configService;
        this.emailVerificationService = emailVerificationService;
        this.securityLogService = securityLogService;
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        if (!clientId) {
            throw new Error('GOOGLE_CLIENT_ID is not configured');
        }
        this.client = new google_auth_library_1.OAuth2Client(clientId);
        this.pool = new pg_1.Pool({
            connectionString: this.configService.get('DATABASE_URL'),
        });
    }
    async validateIdToken(idToken, ipAddress) {
        try {
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
    async handleGoogleAuth(idToken, ipAddress, userAgent) {
        const googleUser = await this.validateIdToken(idToken, ipAddress);
        const existingUser = await this.findUserByEmail(googleUser.email);
        if (existingUser) {
            return await this.handleExistingUser(existingUser, googleUser, ipAddress, userAgent);
        }
        else {
            return await this.handleNewUser(googleUser, ipAddress, userAgent);
        }
    }
    async handleExistingUser(existingUser, googleUser, ipAddress, userAgent) {
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
            return {
                status: 'conflict',
                message: 'This email is already registered with a password. Please sign in with your email and password, or link your Google account from settings.',
                requiresAction: 'signin_or_link',
            };
        }
        const oauthAccount = await this.findOAuthAccount('google', googleUser.sub);
        if (!oauthAccount) {
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
    async handleNewUser(googleUser, ipAddress, userAgent) {
        if (googleUser.email_verified) {
            const user = await this.createVerifiedUser(googleUser);
            await this.securityLogService.log({
                userId: user.id,
                email: user.email,
                eventType: 'google_register',
                success: true,
                ipAddress,
                userAgent,
                metadata: { provider: 'google', emailVerified: true },
            });
            console.log('✅ New verified Google user created:', user.email);
            return {
                status: 'created',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    emailVerified: true,
                    authProvider: 'google',
                },
            };
        }
        else {
            const user = await this.createPendingUser(googleUser);
            await this.emailVerificationService.sendVerificationEmail(user.id, user.email, user.name);
            await this.securityLogService.log({
                userId: user.id,
                email: user.email,
                eventType: 'google_register_pending',
                success: true,
                ipAddress,
                userAgent,
                metadata: { provider: 'google', emailVerified: false, pendingVerification: true },
            });
            console.log('📧 New unverified Google user - verification email sent:', user.email);
            return {
                status: 'pending_verification',
                message: 'Account created. Please verify your email to continue.',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    emailVerified: false,
                    authProvider: 'google',
                },
            };
        }
    }
    async createVerifiedUser(googleUser) {
        const result = await this.pool.query(`INSERT INTO users (email, name, auth_provider, email_verified, google_id, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, email_verified, auth_provider`, [googleUser.email, googleUser.name, 'google', true, googleUser.sub, null]);
        const user = result.rows[0];
        await this.linkOAuthAccount(user.id, googleUser);
        return user;
    }
    async createPendingUser(googleUser) {
        const result = await this.pool.query(`INSERT INTO users (email, name, auth_provider, email_verified, google_id, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, email_verified, auth_provider`, [googleUser.email, googleUser.name, 'google', false, googleUser.sub, null]);
        const user = result.rows[0];
        await this.linkOAuthAccount(user.id, googleUser);
        return user;
    }
    async linkOAuthAccount(userId, googleUser) {
        await this.pool.query(`INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (provider, provider_user_id) 
       DO UPDATE SET email = $4, email_verified = $5, updated_at = NOW()`, [userId, 'google', googleUser.sub, googleUser.email, googleUser.email_verified]);
    }
    async findUserByEmail(email) {
        const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }
    async findOAuthAccount(provider, providerUserId) {
        const result = await this.pool.query('SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2', [provider, providerUserId]);
        return result.rows[0] || null;
    }
};
exports.GoogleOAuthService = GoogleOAuthService;
exports.GoogleOAuthService = GoogleOAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        email_verification_service_1.EmailVerificationService,
        security_log_service_1.SecurityLogService])
], GoogleOAuthService);
//# sourceMappingURL=google-oauth.service.js.map