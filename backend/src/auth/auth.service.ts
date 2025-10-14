import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { db } from '../database/db';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, registerDto.email));
    
    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const [user] = await db.insert(users).values({
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

  async login(loginDto: LoginDto) {
    const [user] = await db.select().from(users).where(eq(users.email, loginDto.email));
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has a password set
    if (!user.password) {
      throw new UnauthorizedException('No password set. Please set a password first or use Google Sign-In.');
    }

    if (!(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
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

  // Google OAuth login/registration
  async googleLogin(googleUser: any) {
    try {
      // Check if user exists
      let [user] = await db.select().from(users).where(eq(users.email, googleUser.email));

      // If user doesn't exist, create one
      if (!user) {
        console.log('🆕 Creating new Google user:', googleUser.email);
        
        // Generate a random password for OAuth users (won't be used, but satisfies DB constraint)
        const randomPassword = crypto.randomBytes(32).toString('hex');
        
        [user] = await db.insert(users).values({
          email: googleUser.email,
          name: googleUser.name,
          password: randomPassword, // Random password for OAuth users
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

  // Get all users (for debugging - remove in production)
  async findAllUsers() {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      authProvider: users.authProvider,
      createdAt: users.createdAt,
      // Don't select password field for security
    }).from(users);
    
    return allUsers;
  }

  // Allow users to set a password (for Google users or password reset)
  async setPassword(userId: number, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
    
    console.log('✅ Password set for user ID:', userId);
    return { message: 'Password set successfully. You can now login with email and password.' };
  }

  // Check if user has a password set
  async hasPassword(userId: number) {
    const [user] = await db.select({ password: users.password })
      .from(users)
      .where(eq(users.id, userId));
    
    return { hasPassword: user && user.password !== null && user.password.length > 0 };
  }

  // Change password for existing users
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    // Get user with password
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.password || user.password.length === 0) {
      throw new UnauthorizedException('No password set. Use set password instead.');
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is different
    if (oldPassword === newPassword) {
      throw new UnauthorizedException('New password must be different from current password');
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
    
    console.log('✅ Password changed for user ID:', userId);
    return { message: 'Password changed successfully' };
  }
}