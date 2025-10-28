"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const jwt_strategy_1 = require("./jwt.strategy");
const google_strategy_1 = require("./google.strategy");
const google_auth_guard_1 = require("./google-auth.guard");
const google_oauth_service_1 = require("./google-oauth.service");
const email_verification_service_1 = require("./email-verification.service");
const password_reset_service_1 = require("./password-reset.service");
const security_log_service_1 = require("./security-log.service");
const rate_limit_service_1 = require("./rate-limit.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production',
                    signOptions: { expiresIn: '24h' },
                }),
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            google_strategy_1.GoogleStrategy,
            google_auth_guard_1.GoogleAuthGuard,
            google_oauth_service_1.GoogleOAuthService,
            email_verification_service_1.EmailVerificationService,
            password_reset_service_1.PasswordResetService,
            security_log_service_1.SecurityLogService,
            rate_limit_service_1.RateLimitService,
        ],
        exports: [
            auth_service_1.AuthService,
            google_auth_guard_1.GoogleAuthGuard,
            google_oauth_service_1.GoogleOAuthService,
            email_verification_service_1.EmailVerificationService,
            security_log_service_1.SecurityLogService,
            rate_limit_service_1.RateLimitService,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map