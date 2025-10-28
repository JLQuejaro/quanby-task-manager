import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards, 
  Req, 
  Res, 
  Query,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './google-oauth.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { RateLimitService } from './rate-limit.service';
import { 
  RegisterDto, 
  LoginDto,
  ChangePasswordDto,
  SetPasswordDto,
  GoogleOAuthCallbackDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto';
import { GoogleAuthGuard } from './google-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleOAuthService: GoogleOAuthService,
    private emailVerificationService: EmailVerificationService,
    private passwordResetService: PasswordResetService,
    private rateLimitService: RateLimitService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user with email verification' })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.register(registerDto, ip, userAgent);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Google OAuth callback - validates ID token and creates/links account',
  })
  async googleCallback(
    @Body() callbackDto: GoogleOAuthCallbackDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.rateLimitService.checkRateLimit(ip, 'oauth_callback');

    const result = await this.googleOAuthService.handleGoogleAuth(
      callbackDto.idToken,
      ip,
      userAgent,
    );

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

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Login with Google (legacy)' })
  async googleAuth(@Req() req: Request) {
    // Initiates Google OAuth flow
  }

  @Get('callback/google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback (legacy)' })
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

  // ===== EMAIL VERIFICATION ENDPOINTS =====

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token and auto-login' })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Ip() ip: string,
  ) {
    try {
      console.log('📬 Verify email request received');
      console.log('🔍 Token (first 20 chars):', verifyEmailDto.token.substring(0, 20) + '...');

      await this.rateLimitService.checkRateLimit(ip, 'email_verification');

      const result = await this.emailVerificationService.verifyEmailAndGenerateToken(
        verifyEmailDto.token,
      );

      await this.rateLimitService.resetRateLimit(ip, 'email_verification');

      console.log('✅ Verification successful for:', result.email);

      return result;
    } catch (error) {
      console.error('❌ Verification endpoint error:', error);
      throw error;
    }
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  async resendVerification(@Req() req: Request) {
    const user = (req as any).user;
    await this.emailVerificationService.resendVerificationEmail(user.id);
    
    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  @Get('verification-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check email verification status' })
  async verificationStatus(@Req() req: Request) {
    const user = (req as any).user;
    const isVerified = await this.emailVerificationService.isEmailVerified(user.id);
    const hasPending = await this.emailVerificationService.hasPendingVerification(user.id);

    return {
      emailVerified: isVerified,
      hasPendingVerification: hasPending,
    };
  }

  // ===== PASSWORD MANAGEMENT ENDPOINTS =====

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set local password for OAuth accounts' })
  async setPassword(
    @Req() req: Request,
    @Body() setPasswordDto: SetPasswordDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const user = (req as any).user;

    if (setPasswordDto.password !== setPasswordDto.passwordConfirm) {
      throw new UnauthorizedException('Passwords do not match');
    }

    return this.authService.setPassword(user.id, setPasswordDto.password, ip, userAgent);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (current → new → confirm)' })
  async changePassword(
    @Req() req: Request,
    @Body() changePasswordDto: ChangePasswordDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const user = (req as any).user;

    return this.authService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
      changePasswordDto.newPasswordConfirm,
      ip,
      userAgent,
    );
  }

  @Get('has-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user has password set' })
  async hasPassword(@Req() req: Request) {
    const user = (req as any).user;
    return this.authService.hasPassword(user.id);
  }

  // ===== PASSWORD RESET ENDPOINTS =====

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Ip() ip: string,
  ) {
    await this.rateLimitService.checkRateLimit(ip, 'password_reset');
    return this.passwordResetService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Ip() ip: string,
  ) {
    await this.rateLimitService.checkRateLimit(ip, 'password_reset');

    const result = await this.passwordResetService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );

    await this.rateLimitService.resetRateLimit(ip, 'password_reset');

    return result;
  }

  // ===== USER INFO ENDPOINTS =====

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: Request) {
    const user = (req as any).user;
    const isVerified = await this.emailVerificationService.isEmailVerified(user.id);
    const hasPasswordResult = await this.authService.hasPassword(user.id);

    return {
      ...user,
      emailVerified: isVerified,
      hasPassword: hasPasswordResult.hasPassword,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all registered users' })
  async getAllUsers() {
    return this.authService.findAllUsers();
  }
}