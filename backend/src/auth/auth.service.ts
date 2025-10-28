import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { db } from '../database/db';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Pool } from 'pg';
import { RegisterDto, LoginDto } from './dto/register.dto';
import { EmailVerificationService } from './email-verification.service';
import { SecurityLogService } from './security-log.service';
import { RateLimitService } from './rate-limit.service';
import { sendPasswordChangedEmail } from '../lib/email';

@Injectable()
export class AuthService {
  private pool: Pool;

  constructor(
    private jwtService: JwtService,
    private emailVerificationService: EmailVerificationService,
    private securityLogService: SecurityLogService,
    private rateLimitService: RateLimitService,
  ) {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string) {
    await this.rateLimitService.checkRateLimit(ipAddress || 'unknown', 'register');

    const [existingUser] = await db.select().from(users).where(eq(users.email, registerDto.email));
    
    if (existingUser) {
      await this.securityLogService.log({
        email: registerDto.email,
        eventType: 'register_failed',
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: 'Email already registered' },
      });
      throw new UnauthorizedException('Email already registered');
    }

    this.validatePasswordStrength(registerDto.password);

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    
    const [user] = await db.insert(users).values({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      authProvider: 'email',
      emailVerified: false,
    }).returning();

    await this.emailVerificationService.sendVerificationEmail(
      user.id,
      user.email,
      user.name,
    );

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

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    await this.rateLimitService.checkRateLimit(ipAddress || 'unknown', 'login');

    const [user] = await db.select().from(users).where(eq(users.email, loginDto.email));
    
    if (!user) {
      await this.securityLogService.log({
        email: loginDto.email,
        eventType: 'login_failed',
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: 'User not found' },
      });
      throw new UnauthorizedException('Invalid credentials');
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
      throw new UnauthorizedException('No password set. Please set a password first or use Google Sign-In.');
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
      throw new UnauthorizedException('Invalid credentials');
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

  async googleLogin(googleUser: any) {
    try {
      let [user] = await db.select().from(users).where(eq(users.email, googleUser.email));

      if (!user) {
        console.log('🆕 Creating new Google user:', googleUser.email);
        
        const randomPassword = crypto.randomBytes(32).toString('hex');
        
        [user] = await db.insert(users).values({
          email: googleUser.email,
          name: googleUser.name,
          password: randomPassword,
          authProvider: 'google',
        }).returning();
        
        console.log('✅ New Google user created:', user.email);
      } else {
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
    } catch (error) {
      console.error('❌ Google login error:', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async validateUser(userId: number) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }

  async findAllUsers() {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      authProvider: users.authProvider,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    }).from(users);
    
    return allUsers;
  }

  async setPassword(
    userId: number, 
    newPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    this.validatePasswordStrength(newPassword);

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isVerified = await this.emailVerificationService.isEmailVerified(userId);
    if (!isVerified) {
      throw new UnauthorizedException('Please verify your email before setting a password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await db.update(users)
      .set({ 
        password: hashedPassword,
        lastPasswordChange: new Date(),
      })
      .where(eq(users.id, userId));

    await this.securityLogService.log({
      userId,
      email: user.email,
      eventType: 'password_set',
      success: true,
      ipAddress,
      userAgent,
    });

    await sendPasswordChangedEmail(user.email, user.name);
    
    console.log('✅ Password set for user ID:', userId);
    return { 
      message: 'Password set successfully. You can now login with email and password.',
    };
  }

  async hasPassword(userId: number) {
    const [user] = await db.select({ password: users.password })
      .from(users)
      .where(eq(users.id, userId));
    
    return { hasPassword: user && user.password !== null && user.password.length > 0 };
  }

  async changePassword(
    userId: number, 
    currentPassword: string, 
    newPassword: string,
    newPasswordConfirm: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.rateLimitService.checkRateLimit(`user_${userId}`, 'password_change');

    if (newPassword !== newPasswordConfirm) {
      throw new BadRequestException('New passwords do not match');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    this.validatePasswordStrength(newPassword);

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.password || user.password.length === 0) {
      throw new UnauthorizedException('No password set. Use set password instead.');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      await this.securityLogService.log({
        userId,
        email: user.email,
        eventType: 'password_change_failed',
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: 'Incorrect current password' },
      });
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await db.update(users)
      .set({ 
        password: hashedPassword,
        lastPasswordChange: new Date(),
      })
      .where(eq(users.id, userId));

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

    await sendPasswordChangedEmail(user.email, user.name);
    
    console.log('✅ Password changed for user ID:', userId);
    
    return { 
      message: 'Password changed successfully. All other sessions have been logged out.',
    };
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
    }
  }

  private async createSession(
    userId: number,
    token: string,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<void> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await this.pool.query(
        `INSERT INTO active_sessions (user_id, token_hash, device_info, ip_address, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, tokenHash, deviceInfo, ipAddress, expiresAt]
      );
    } catch (error) {
      console.error('Error creating session:', error);
    }
  }

  private async revokeAllUserSessions(userId: number): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE active_sessions 
         SET is_revoked = TRUE 
         WHERE user_id = $1 AND is_revoked = FALSE`,
        [userId]
      );

      console.log(`🔒 All sessions revoked for user ID: ${userId}`);
    } catch (error) {
      console.error('Error revoking sessions:', error);
    }
  }
}