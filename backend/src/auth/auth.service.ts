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
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const [user] = await db.insert(users).values({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
    }).returning();

    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const [user] = await db.select().from(users).where(eq(users.email, loginDto.email));
    
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  // New method for Google OAuth
  async googleLogin(googleUser: any) {
    // Check if user exists
    let [user] = await db.select().from(users).where(eq(users.email, googleUser.email));

    // If user doesn't exist, create one
    if (!user) {
      [user] = await db.insert(users).values({
        email: googleUser.email,
        name: googleUser.name,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for Google users
      }).returning();
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async validateUser(userId: number) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }
}