import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { db } from '../database/db';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
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
    }).returning();

    const { password, ...result } = user;
    console.log('✅ New user registered:', result.email);
    return result;
  }

  async login(loginDto: LoginDto) {
    const [user] = await db.select().from(users).where(eq(users.email, loginDto.email));
    
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    console.log('✅ User logged in:', user.email);
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id.toString(), email: user.email, name: user.name },
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
        [user] = await db.insert(users).values({
          email: googleUser.email,
          name: googleUser.name,
          password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for Google users
        }).returning();
        console.log('✅ New Google user created:', user.email);
      } else {
        console.log('✅ Existing Google user logged in:', user.email);
      }

      const payload = { sub: user.id, email: user.email };
      return {
        access_token: await this.jwtService.signAsync(payload),
        user: { id: user.id.toString(), email: user.email, name: user.name },
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
      createdAt: users.createdAt,
      // Don't select password field for security
    }).from(users);
    
    return allUsers;
  }
}