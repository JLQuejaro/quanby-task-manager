import { 
  Controller, 
  Get, 
  Post, 
  Delete,
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
  BadRequestException,
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
  DeleteAccountDto,
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

  /**
   * ✅ POST /api/auth/google/verify-email
   * Verify Google user's email from verification link
   */
  @Post('google/verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Google user email from verification link' })
  async verifyGoogleEmail(
    @Body() body: { token: string },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    console.log('📧 Google email verification request');
    
    const result = await this.googleOAuthService.verifyGoogleUser(
      body.token,
      ip,
      userAgent,
    );
    
    // Generate JWT token for auto-login
    const payload = { sub: result.user.id, email: result.user.email };
    const accessToken = await this.authService['jwtService'].signAsync(payload);
    
    return {
      success: true,
      message: 'Email verified successfully',
      access_token: accessToken,
      user: result.user,
    };
  }

  // ===== LEGACY ENDPOINTS (Passport-based Google OAuth) =====

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ 
    summary: 'Login with Google - Initiates OAuth flow',
  })
  async googleAuth(@Req() req: Request) {
    // Initiates Google OAuth flow
    // This is handled by GoogleAuthGuard (Passport)
  }

  @Get('callback/google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ 
    summary: 'Google OAuth callback - handles redirect from Google',
  })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const googleUser = (req as any).user;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      console.log('🔄 Legacy Google OAuth callback hit');
      console.log('👤 Google user:', googleUser);

      // ✅ FIXED: Use new handleGoogleAuthPassport method for Passport flow
      const result = await this.googleOAuthService.handleGoogleAuthPassport(
        {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.googleId,
        },
        ipAddress,
        userAgent,
      );

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      // Read flow intent from cookie or state
      const cookies = req.headers['cookie'] || '';
      const cookieMatch = cookies.match(/(?:^|; )oauth_flow=([^;]+)/);
      const flowMode = cookieMatch ? decodeURIComponent(cookieMatch[1]) : (req.query['state'] as string) || 'login';

      // Handle different scenarios
      if (result.status === 'no_account') {
        // If initiated from register, create pending registration and send verification email
        if (flowMode === 'register') {
          console.log('🆕 No account and flow=register - creating pending Google registration');
          const regResult = await this.googleOAuthService.startRegistrationFromPassport(
            {
              email: googleUser.email,
              name: googleUser.name,
              picture: googleUser.picture,
              googleId: googleUser.googleId,
            },
            ipAddress,
            userAgent,
          );
          return res.redirect(
            `${frontendUrl}/verify-email-notice?message=${encodeURIComponent(
              regResult.message || 'Please check your email to verify your account'
            )}&email=${encodeURIComponent(googleUser.email)}`
          );
        }
        // Otherwise inform on login page and let it redirect to register with message
        console.log('❌ No account found - redirecting to login with message then to register');
        return res.redirect(
          `${frontendUrl}/login?error=${encodeURIComponent(
            result.message || 'Please register first'
          )}&email=${encodeURIComponent(googleUser.email)}`
        );
      }

      if (result.status === 'pending_verification') {
        // SCENARIO 1: Existing user needs verification
        console.log('📧 Verification required - redirecting to verify-email notice page');
        return res.redirect(
          `${frontendUrl}/verify-email-notice?message=${encodeURIComponent(
            result.message || 'Please check your email to verify your account'
          )}&email=${encodeURIComponent(googleUser.email)}`
        );
      }

      if (result.status === 'existing' && result.user) {
        // User verified and logged in successfully
        const payload = { sub: result.user.id, email: result.user.email };
        const accessToken = await this.authService['jwtService'].signAsync(payload);
        return res.redirect(`${frontendUrl}/callback?token=${accessToken}`);
      }

      // Handle unexpected status
      console.error('❌ Unexpected status:', result.status);
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent('Authentication failed')}`
      );
    } catch (error) {
      console.error('❌ Legacy Google OAuth error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  // ===== EMAIL VERIFICATION ENDPOINTS =====

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token from URL query parameter' })
  async verifyEmailGet(
    @Query('token') token: string,
    @Ip() ip: string,
  ) {
    try {
      console.log('📬 GET Verify email request received');
      
      if (!token) {
        console.error('❌ No token provided in query parameter');
        throw new BadRequestException('Verification token is required');
      }

      console.log('🔍 Token (first 20 chars):', token.substring(0, 20) + '...');

      await this.rateLimitService.checkRateLimit(ip, 'email_verification');

      const result = await this.emailVerificationService.verifyEmailAndGenerateToken(token);

      await this.rateLimitService.resetRateLimit(ip, 'email_verification');

      console.log('✅ Verification successful for:', result.email);

      return result;
    } catch (error) {
      console.error('❌ GET Verification endpoint error:', error);
      throw error;
    }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token in request body (POST version)' })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Ip() ip: string,
  ) {
    try {
      console.log('📬 POST Verify email request received');
      console.log('📦 Request body:', verifyEmailDto);

      if (!verifyEmailDto || !verifyEmailDto.token) {
        console.error('❌ No token provided in request body');
        throw new BadRequestException('Verification token is required in request body');
      }

      console.log('🔍 Token (first 20 chars):', verifyEmailDto.token.substring(0, 20) + '...');

      await this.rateLimitService.checkRateLimit(ip, 'email_verification');

      const result = await this.emailVerificationService.verifyEmailAndGenerateToken(
        verifyEmailDto.token,
      );

      await this.rateLimitService.resetRateLimit(ip, 'email_verification');

      console.log('✅ Verification successful for:', result.email);

      return result;
    } catch (error) {
      console.error('❌ POST Verification endpoint error:', error);
      throw error;
    }
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email (optionally force even if already verified)' })
  async resendVerification(@Req() req: Request, @Body() body?: { force?: boolean }) {
    const user = (req as any).user;
    const force = body?.force === true;

    await this.emailVerificationService.resendVerificationEmail(user.id, force);
    
    return {
      message: 'Verification email sent. Please check your inbox.',
      forced: force || undefined,
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

    console.log('🔐 Backend received DTO:', {
      currentPassword: changePasswordDto.currentPassword ? `${changePasswordDto.currentPassword.length} chars` : 'MISSING',
      newPassword: changePasswordDto.newPassword ? `${changePasswordDto.newPassword.length} chars` : 'MISSING',
      newPasswordConfirm: changePasswordDto.newPasswordConfirm ? `${changePasswordDto.newPasswordConfirm.length} chars` : 'MISSING',
      dtoKeys: Object.keys(changePasswordDto),
      dtoType: typeof changePasswordDto,
    });

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

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete account' })
  async deleteAccount(
    @Req() req: Request,
    @Body() deleteAccountDto: DeleteAccountDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const user = (req as any).user;
    return this.authService.deleteAccount(
      user.id,
      deleteAccountDto.password,
      ip,
      userAgent,
    );
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