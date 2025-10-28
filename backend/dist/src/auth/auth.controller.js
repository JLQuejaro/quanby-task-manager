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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const google_oauth_service_1 = require("./google-oauth.service");
const email_verification_service_1 = require("./email-verification.service");
const password_reset_service_1 = require("./password-reset.service");
const rate_limit_service_1 = require("./rate-limit.service");
const dto_1 = require("./dto");
const google_auth_guard_1 = require("./google-auth.guard");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
let AuthController = class AuthController {
    constructor(authService, googleOAuthService, emailVerificationService, passwordResetService, rateLimitService) {
        this.authService = authService;
        this.googleOAuthService = googleOAuthService;
        this.emailVerificationService = emailVerificationService;
        this.passwordResetService = passwordResetService;
        this.rateLimitService = rateLimitService;
    }
    async register(registerDto, ip, userAgent) {
        return this.authService.register(registerDto, ip, userAgent);
    }
    async login(loginDto, ip, userAgent) {
        return this.authService.login(loginDto, ip, userAgent);
    }
    async googleCallback(callbackDto, ip, userAgent) {
        await this.rateLimitService.checkRateLimit(ip, 'oauth_callback');
        const result = await this.googleOAuthService.handleGoogleAuth(callbackDto.idToken, ip, userAgent);
        if (result.status !== 'conflict') {
            await this.rateLimitService.resetRateLimit(ip, 'oauth_callback');
        }
        if (result.user && (result.status === 'created' || result.status === 'existing')) {
            const payload = { sub: result.user.id, email: result.user.email };
            const accessToken = await this.authService['jwtService'].signAsync(payload);
            return {
                ...result,
                access_token: accessToken,
            };
        }
        return result;
    }
    async googleAuth(req) {
    }
    async googleAuthRedirect(req, res) {
        try {
            const result = await this.authService.googleLogin(req.user);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            return res.redirect(`${frontendUrl}/callback?token=${result.access_token}`);
        }
        catch (error) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            return res.redirect(`${frontendUrl}/callback?error=${encodeURIComponent(errorMessage)}`);
        }
    }
    async verifyEmailGet(token, ip) {
        try {
            console.log('📬 GET Verify email request received');
            if (!token) {
                console.error('❌ No token provided in query parameter');
                throw new common_1.BadRequestException('Verification token is required');
            }
            console.log('🔍 Token (first 20 chars):', token.substring(0, 20) + '...');
            await this.rateLimitService.checkRateLimit(ip, 'email_verification');
            const result = await this.emailVerificationService.verifyEmailAndGenerateToken(token);
            await this.rateLimitService.resetRateLimit(ip, 'email_verification');
            console.log('✅ Verification successful for:', result.email);
            return result;
        }
        catch (error) {
            console.error('❌ GET Verification endpoint error:', error);
            throw error;
        }
    }
    async verifyEmail(verifyEmailDto, ip) {
        try {
            console.log('📬 POST Verify email request received');
            console.log('📦 Request body:', verifyEmailDto);
            if (!verifyEmailDto || !verifyEmailDto.token) {
                console.error('❌ No token provided in request body');
                throw new common_1.BadRequestException('Verification token is required in request body');
            }
            console.log('🔍 Token (first 20 chars):', verifyEmailDto.token.substring(0, 20) + '...');
            await this.rateLimitService.checkRateLimit(ip, 'email_verification');
            const result = await this.emailVerificationService.verifyEmailAndGenerateToken(verifyEmailDto.token);
            await this.rateLimitService.resetRateLimit(ip, 'email_verification');
            console.log('✅ Verification successful for:', result.email);
            return result;
        }
        catch (error) {
            console.error('❌ POST Verification endpoint error:', error);
            throw error;
        }
    }
    async resendVerification(req) {
        const user = req.user;
        await this.emailVerificationService.resendVerificationEmail(user.id);
        return {
            message: 'Verification email sent. Please check your inbox.',
        };
    }
    async verificationStatus(req) {
        const user = req.user;
        const isVerified = await this.emailVerificationService.isEmailVerified(user.id);
        const hasPending = await this.emailVerificationService.hasPendingVerification(user.id);
        return {
            emailVerified: isVerified,
            hasPendingVerification: hasPending,
        };
    }
    async setPassword(req, setPasswordDto, ip, userAgent) {
        const user = req.user;
        if (setPasswordDto.password !== setPasswordDto.passwordConfirm) {
            throw new common_1.UnauthorizedException('Passwords do not match');
        }
        return this.authService.setPassword(user.id, setPasswordDto.password, ip, userAgent);
    }
    async changePassword(req, changePasswordDto, ip, userAgent) {
        const user = req.user;
        return this.authService.changePassword(user.id, changePasswordDto.currentPassword, changePasswordDto.newPassword, changePasswordDto.newPasswordConfirm, ip, userAgent);
    }
    async hasPassword(req) {
        const user = req.user;
        return this.authService.hasPassword(user.id);
    }
    async forgotPassword(forgotPasswordDto, ip) {
        await this.rateLimitService.checkRateLimit(ip, 'password_reset');
        return this.passwordResetService.forgotPassword(forgotPasswordDto.email);
    }
    async resetPassword(resetPasswordDto, ip) {
        await this.rateLimitService.checkRateLimit(ip, 'password_reset');
        const result = await this.passwordResetService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
        await this.rateLimitService.resetRateLimit(ip, 'password_reset');
        return result;
    }
    async getProfile(req) {
        const user = req.user;
        const isVerified = await this.emailVerificationService.isEmailVerified(user.id);
        const hasPasswordResult = await this.authService.hasPassword(user.id);
        return {
            ...user,
            emailVerified: isVerified,
            hasPassword: hasPasswordResult.hasPassword,
        };
    }
    async getAllUsers() {
        return this.authService.findAllUsers();
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register new user with email verification' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterDto, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'Login user' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('google/callback'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Google OAuth callback - validates ID token and creates/links account',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.GoogleOAuthCallbackDto, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Login with Google (legacy)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('callback/google'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Google OAuth callback (legacy)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthRedirect", null);
__decorate([
    (0, common_1.Get)('verify-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify email with token from URL query parameter' }),
    __param(0, (0, common_1.Query)('token')),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmailGet", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify email with token in request body (POST version)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.VerifyEmailDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('resend-verification'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resend verification email' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerification", null);
__decorate([
    (0, common_1.Get)('verification-status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Check email verification status' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verificationStatus", null);
__decorate([
    (0, common_1.Post)('set-password'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Set local password for OAuth accounts' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SetPasswordDto, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "setPassword", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Change password (current → new → confirm)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ChangePasswordDto, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)('has-password'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Check if user has password set' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "hasPassword", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset email' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ForgotPasswordDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password with token' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ResetPasswordDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all registered users' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAllUsers", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        google_oauth_service_1.GoogleOAuthService,
        email_verification_service_1.EmailVerificationService,
        password_reset_service_1.PasswordResetService,
        rate_limit_service_1.RateLimitService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map