import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { Pool } from 'pg';
import { EmailVerificationService } from './email-verification.service';
import { SecurityLogService } from './security-log.service';

// Export these interfaces so they can be used in other files
export interface GoogleTokenPayload {
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  sub: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

export interface GoogleAuthResult {
  status: 'created' | 'existing' | 'pending_verification' | 'conflict';
  user?: any;
  message?: string;
  requiresAction?: string;
}

@Injectable()
export class GoogleOAuthService {
  private client: OAuth2Client;
  private pool: Pool;

  constructor(
    private configService: ConfigService,
    private emailVerificationService: EmailVerificationService,
    private securityLogService: SecurityLogService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }
    
    this.client = new OAuth2Client(clientId);
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
    });
  }

  async validateIdToken(idToken: string, ipAddress?: string): Promise<GoogleTokenPayload> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        await this.securityLogService.log({
          eventType: 'oauth_validation_failed',
          success: false,
          metadata: { reason: 'Empty payload', provider: 'google' },
          ipAddress,
        });
        throw new UnauthorizedException('Invalid token payload');
      }

      // Validate issuer
      if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
        await this.securityLogService.log({
          eventType: 'oauth_validation_failed',
          success: false,
          metadata: { reason: 'Invalid issuer', issuer: payload.iss, provider: 'google' },
          ipAddress,
        });
        throw new UnauthorizedException('Invalid token issuer');
      }

      // Validate audience
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      if (payload.aud !== clientId) {
        await this.securityLogService.log({
          eventType: 'oauth_validation_failed',
          success: false,
          metadata: { reason: 'Invalid audience', provider: 'google' },
          ipAddress,
        });
        throw new UnauthorizedException('Invalid token audience');
      }

      // Validate expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        await this.securityLogService.log({
          eventType: 'oauth_validation_failed',
          success: false,
          metadata: { reason: 'Token expired', provider: 'google' },
          ipAddress,
        });
        throw new UnauthorizedException('Token has expired');
      }

      // Validate issued at time
      if (payload.iat && payload.iat > now + 300) {
        await this.securityLogService.log({
          eventType: 'oauth_validation_failed',
          success: false,
          metadata: { reason: 'Invalid issued time', provider: 'google' },
          ipAddress,
        });
        throw new UnauthorizedException('Invalid token issued time');
      }

      if (!payload.email) {
        throw new UnauthorizedException('Email not found in token');
      }

      console.log('✅ Google ID token validated successfully:', payload.email);

      return {
        email: payload.email,
        email_verified: payload.email_verified || false,
        name: payload.name || 'User',
        picture: payload.picture,
        sub: payload.sub,
        iat: payload.iat || now,
        exp: payload.exp || now + 3600,
        aud: payload.aud,
        iss: payload.iss,
      };
    } catch (error) {
      console.error('❌ Google ID token validation error:', error);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      await this.securityLogService.log({
        eventType: 'oauth_validation_failed',
        success: false,
        metadata: { reason: error.message, provider: 'google' },
        ipAddress,
      });
      
      throw new UnauthorizedException('Failed to validate Google token');
    }
  }

  async handleGoogleAuth(
    idToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GoogleAuthResult> {
    const googleUser = await this.validateIdToken(idToken, ipAddress);

    const existingUser = await this.findUserByEmail(googleUser.email);

    if (existingUser) {
      return await this.handleExistingUser(existingUser, googleUser, ipAddress, userAgent);
    } else {
      return await this.handleNewUser(googleUser, ipAddress, userAgent);
    }
  }

  private async handleExistingUser(
    existingUser: any,
    googleUser: GoogleTokenPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GoogleAuthResult> {
    if (existingUser.auth_provider === 'email' && existingUser.password) {
      await this.securityLogService.log({
        userId: existingUser.id,
        email: existingUser.email,
        eventType: 'oauth_conflict',
        success: false,
        ipAddress,
        userAgent,
        metadata: {
          reason: 'Email already registered with password',
          provider: 'google',
        },
      });

      return {
        status: 'conflict',
        message: 'This email is already registered with a password. Please sign in with your email and password, or link your Google account from settings.',
        requiresAction: 'signin_or_link',
      };
    }

    const oauthAccount = await this.findOAuthAccount('google', googleUser.sub);

    if (!oauthAccount) {
      await this.linkOAuthAccount(existingUser.id, googleUser);
    }

    await this.pool.query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [existingUser.id]
    );

    await this.securityLogService.log({
      userId: existingUser.id,
      email: existingUser.email,
      eventType: 'google_login',
      success: true,
      ipAddress,
      userAgent,
      metadata: { provider: 'google' },
    });

    console.log('✅ Existing Google user logged in:', existingUser.email);

    return {
      status: 'existing',
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        emailVerified: existingUser.email_verified,
        authProvider: 'google',
      },
    };
  }

  private async handleNewUser(
    googleUser: GoogleTokenPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GoogleAuthResult> {
    if (googleUser.email_verified) {
      const user = await this.createVerifiedUser(googleUser);

      await this.securityLogService.log({
        userId: user.id,
        email: user.email,
        eventType: 'google_register',
        success: true,
        ipAddress,
        userAgent,
        metadata: { provider: 'google', emailVerified: true },
      });

      console.log('✅ New verified Google user created:', user.email);

      return {
        status: 'created',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: true,
          authProvider: 'google',
        },
      };
    } else {
      const user = await this.createPendingUser(googleUser);

      await this.emailVerificationService.sendVerificationEmail(
        user.id,
        user.email,
        user.name,
      );

      await this.securityLogService.log({
        userId: user.id,
        email: user.email,
        eventType: 'google_register_pending',
        success: true,
        ipAddress,
        userAgent,
        metadata: { provider: 'google', emailVerified: false, pendingVerification: true },
      });

      console.log('📧 New unverified Google user - verification email sent:', user.email);

      return {
        status: 'pending_verification',
        message: 'Account created. Please verify your email to continue.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: false,
          authProvider: 'google',
        },
      };
    }
  }

  private async createVerifiedUser(googleUser: GoogleTokenPayload): Promise<any> {
    const result = await this.pool.query(
      `INSERT INTO users (email, name, auth_provider, email_verified, google_id, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, email_verified, auth_provider`,
      [googleUser.email, googleUser.name, 'google', true, googleUser.sub, null]
    );

    const user = result.rows[0];
    await this.linkOAuthAccount(user.id, googleUser);
    return user;
  }

  private async createPendingUser(googleUser: GoogleTokenPayload): Promise<any> {
    const result = await this.pool.query(
      `INSERT INTO users (email, name, auth_provider, email_verified, google_id, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, email_verified, auth_provider`,
      [googleUser.email, googleUser.name, 'google', false, googleUser.sub, null]
    );

    const user = result.rows[0];
    await this.linkOAuthAccount(user.id, googleUser);
    return user;
  }

  private async linkOAuthAccount(userId: number, googleUser: GoogleTokenPayload): Promise<void> {
    await this.pool.query(
      `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (provider, provider_user_id) 
       DO UPDATE SET email = $4, email_verified = $5, updated_at = NOW()`,
      [userId, 'google', googleUser.sub, googleUser.email, googleUser.email_verified]
    );
  }

  private async findUserByEmail(email: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  private async findOAuthAccount(provider: string, providerUserId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2',
      [provider, providerUserId]
    );
    return result.rows[0] || null;
  }
}