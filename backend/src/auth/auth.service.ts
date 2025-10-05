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

  // Register new user
  async register(registerDto: RegisterDto) {
    // Hash password for security
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    // Insert user into database
    const [user] = await db.insert(users).values({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
    }).returning();

    // Don't return password to client
    const { password, ...result } = user;
    return result;
  }

  // Login existing user
  async login(loginDto: LoginDto) {
    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, loginDto.email));
    
    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create JWT token
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  // Validate user from JWT token
  async validateUser(userId: number) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return null;
    
    const { password, ...result } = user;
    return result;
  }
}