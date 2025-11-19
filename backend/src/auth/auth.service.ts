import { Injectable, UnauthorizedException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
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

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string) {
    await this.rateLimitService.checkRateLimit(ipAddress || 'unknown', 'register');

    const existingUser = await this.findByEmail(registerDto.email);
    
    if (existingUser) {
      await this.securityLogService.log({
        email: registerDto.email,
        eventType: 'register_failed',
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: 'Email already registered' },
      });

      console.log('❌ Registration failed: Email already exists:', registerDto.email);
      
      throw new ConflictException({
        statusCode: 409,
        message: 'This email is already registered. Please login instead or use a different email.',
        error: 'Conflict',
        action: 'redirect_to_login',
        email: registerDto.email,
      });
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

    // ✅ FIXED: Check if user exists
    const user = await this.findByEmail(loginDto.email);
    
    if (!user) {
      await this.securityLogService.log({
        email: loginDto.email,
        eventType: 'login_failed',
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: 'User not found' },
      });

      console.log('❌ Login failed: User not found:', loginDto.email);
      
      throw new NotFoundException({
        statusCode: 404,
        message: 'No account found with this email. Please register first.',
        error: 'Not Found',
        action: 'redirect_to_register',
        email: loginDto.email,
      });
    }

    // ✅ FIXED: Check if user has password set
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

      console.log('❌ Login failed: No password set for:', user.email);
      
      throw new ConflictException({
        statusCode: 409,
        message: 'This account uses Google Sign-In. Please use the Google button instead.',
        error: 'Conflict',
        action: 'use_google_signin',
        email: user.email,
      });
    }

    // ✅ FIXED: Validate password
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

      console.log('❌ Login failed: Invalid password for:', user.email);
      
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Incorrect password. Please try again.',
        error: 'Unauthorized',
        action: 'retry_password',
        email: user.email,
      });
    }

    // ✅ FIXED: Manual email/password login should work without verification requirement
    // Only enforce verification if rememberMe is false (removed this logic)
    
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
    console.log('🔐 setPassword called with:', {
      userId,
      newPasswordLength: newPassword?.length || 0,
      ipAddress,
    });

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.password && user.password.length > 0) {
      throw new BadRequestException('Password already set. Use change password instead.');
    }

    this.validatePasswordStrength(newPassword);

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
    confirmPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    console.log('🔐 changePassword called with:', {
      userId,
      currentPasswordLength: currentPassword?.length || 0,
      newPasswordLength: newPassword?.length || 0,
      confirmPasswordLength: confirmPassword?.length || 0,
      ipAddress,
    });

    await this.rateLimitService.checkRateLimit(`user_${userId}`, 'password_change');

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.password || user.password.length === 0) {
      throw new UnauthorizedException('No password set. Use set password instead.');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
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

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    this.validatePasswordStrength(newPassword);

    const isSameAsCurrentPassword = await bcrypt.compare(newPassword, user.password);
    
    if (isSameAsCurrentPassword) {
      await this.securityLogService.log({
        userId,
        email: user.email,
        eventType: 'password_change_failed',
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: 'New password same as current' },
      });
      throw new BadRequestException('New password must be different from current password');
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
    if (!password || typeof password !== 'string') {
      throw new BadRequestException('Password is required');
    }

    const trimmedPassword = password.trim();
    
    if (trimmedPassword.length === 0) {
      throw new BadRequestException('Password cannot be empty');
    }

    if (trimmedPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter (A-Z)');
    }

    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter (a-z)');
    }

    if (!/[0-9]/.test(password)) {
      throw new BadRequestException('Password must contain at least one number (0-9)');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character (!@#$%^&*)');
    }

    if (/\s/.test(password)) {
      throw new BadRequestException('Password must not contain spaces');
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