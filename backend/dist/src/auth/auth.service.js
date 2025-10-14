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
let AuthService = class AuthService {
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const [existingUser] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, registerDto.email));
        if (existingUser) {
            throw new common_1.UnauthorizedException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const [user] = await db_1.db.insert(schema_1.users).values({
            email: registerDto.email,
            password: hashedPassword,
            name: registerDto.name,
            authProvider: 'email',
        }).returning();
        const payload = { sub: user.id, email: user.email };
        console.log('✅ New user registered:', user.email);
        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                authProvider: user.authProvider || 'email'
            },
        };
    }
    async login(loginDto) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, loginDto.email));
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.password) {
            throw new common_1.UnauthorizedException('No password set. Please set a password first or use Google Sign-In.');
        }
        if (!(await bcrypt.compare(loginDto.password, user.password))) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: user.id, email: user.email };
        console.log('✅ User logged in:', user.email);
        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                authProvider: user.authProvider || 'email'
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
                    authProvider: user.authProvider || 'google'
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
            createdAt: schema_1.users.createdAt,
        }).from(schema_1.users);
        return allUsers;
    }
    async setPassword(userId, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db_1.db.update(schema_1.users)
            .set({ password: hashedPassword })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        console.log('✅ Password set for user ID:', userId);
        return { message: 'Password set successfully. You can now login with email and password.' };
    }
    async hasPassword(userId) {
        const [user] = await db_1.db.select({ password: schema_1.users.password })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        return { hasPassword: user && user.password !== null && user.password.length > 0 };
    }
    async changePassword(userId, oldPassword, newPassword) {
        const [user] = await db_1.db.select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (!user.password || user.password.length === 0) {
            throw new common_1.UnauthorizedException('No password set. Use set password instead.');
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        if (oldPassword === newPassword) {
            throw new common_1.UnauthorizedException('New password must be different from current password');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db_1.db.update(schema_1.users)
            .set({ password: hashedPassword })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        console.log('✅ Password changed for user ID:', userId);
        return { message: 'Password changed successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map