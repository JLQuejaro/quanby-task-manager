import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards, 
  Req, 
  Res, 
  UnauthorizedException,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthGuard } from './google-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PasswordResetService } from './password-reset.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordResetService: PasswordResetService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Login with Google' })
  async googleAuth(@Req() req: Request) {
    // Initiates Google OAuth flow
  }

  @Get('callback/google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.authService.googleLogin((req as any).user);
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/callback?token=${result.access_token}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      return res.redirect(`${frontendUrl}/callback?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: Request) {
    return (req as any).user;
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all registered users' })
  async getAllUsers() {
    return this.authService.findAllUsers();
  }

  @Get('has-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user has password set' })
  async hasPassword(@Req() req: Request) {
    const user = (req as any).user;
    return this.authService.hasPassword(user.id);
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set password for account' })
  async setPassword(@Req() req: Request, @Body() body: { password: string }) {
    const user = (req as any).user;
    
    if (!body.password || body.password.length < 6) {
      throw new UnauthorizedException('Password must be at least 6 characters');
    }
    
    return this.authService.setPassword(user.id, body.password);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for account' })
  async changePassword(
    @Req() req: Request, 
    @Body() body: { oldPassword: string; newPassword: string }
  ) {
    const user = (req as any).user;
    
    if (!body.oldPassword || !body.newPassword) {
      throw new UnauthorizedException('Both old and new passwords are required');
    }
    
    if (body.newPassword.length < 6) {
      throw new UnauthorizedException('New password must be at least 6 characters');
    }
    
    return this.authService.changePassword(user.id, body.oldPassword, body.newPassword);
  }

  // ===== NEW PASSWORD RESET ENDPOINTS =====
  
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.passwordResetService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }
}