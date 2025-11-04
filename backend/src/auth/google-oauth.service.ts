import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import { sendGoogleVerificationEmail } from '../lib/email';
import { SecurityLogService } from './security-log.service';

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
  status: 'created' | 'existing' | 'pending_verification' | 'conflict' | 'no_account';
  user?: any;
  message?: string;
  requiresAction?: string;
  access_token?: string;
}

@Injectable()
export class GoogleOAuthService {
  private client: OAuth2Client;
  private pool: Pool;

  constructor(
    private configService: ConfigService,
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

    console.log('🔐 GoogleOAuthService initialized');
  }

  /**
   * ✅ Validate Google ID token (used for client-side Google Sign-In)
   */
  async validateIdToken(idToken: string, ipAddress?: string): Promise<GoogleTokenPayload> {
    try {
      console.log('🔍 Validating Google ID token...');

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

      if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
        await this.securityLogService.log({
          eventType: 'oauth_validation_failed',
          success: false,
          metadata: { reason: 'Invalid issuer', issuer: payload.iss, provider: 'google' },
          ipAddress,
        });
        throw new UnauthorizedException('Invalid token issuer');
      }

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

  /**
   * ✅ UPDATED: Handle Google Auth via Passport (server-side flow)
   * For Scenario 1 & 2: Always require email verification
   */
  async handleGoogleAuthPassport(
    googleData: {
      email: string;
      name: string;
      picture?: string;
      googleId: string;
    },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GoogleAuthResult> {
    console.log('='.repeat(80));
    console.log('🔐 GOOGLE AUTH REQUEST (PASSPORT)');
    console.log('='.repeat(80));
    console.log('👤 Google User:', googleData);

    // Step 1: Check if user exists in main users table
    const existingUser = await this.findUserByEmail(googleData.email);

    if (!existingUser) {
      // SCENARIO 2: User doesn't exist - tell them to register first
      console.log('❌ No account found - user must register first');
      
      await this.securityLogService.log({
        email: googleData.email,
        eventType: 'google_login_no_account',
        success: false,
        ipAddress,
        userAgent,
        metadata: { 
          provider: 'google',
          reason: 'No account exists',
        },
      });

      console.log('='.repeat(80));

      return {
        status: 'no_account',
        message: 'No account found with this email. Please register first by clicking "Continue with Google" on the registration page.',
        requiresAction: 'register_required',
      };
    }

    // SCENARIO 1: User exists - ALWAYS send verification email for security
    console.log('✅ Existing user found - sending verification email for security');

    // Check if there's already a pending verification
    const tempRegistration = await this.findTemporaryRegistration(googleData.googleId);

    if (tempRegistration) {
      console.log('📧 Temporary registration found - resending verification');
      return await this.handlePendingRegistration(
        tempRegistration,
        {
          email: googleData.email,
          name: googleData.name,
          picture: googleData.picture,
          sub: googleData.googleId,
          email_verified: false,
          iat: 0,
          exp: 0,
          aud: '',
          iss: '',
        },
        ipAddress,
        userAgent,
      );
    }

    // Create temporary verification for existing user
    console.log('📧 Creating verification request for existing user');
    const verificationToken = this.generateSecureToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const registrationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.createTemporaryRegistration({
      email: googleData.email,
      name: googleData.name,
      googleId: googleData.googleId,
      googleEmail: googleData.email,
      googleName: googleData.name,
      googlePicture: googleData.picture,
      verificationToken,
      tokenExpiresAt,
      expiresAt: registrationExpiresAt,
    });

    // Send verification email
    await sendGoogleVerificationEmail(googleData.email, verificationToken, googleData.name);

    await this.securityLogService.log({
      userId: existingUser.id,
      email: existingUser.email,
      eventType: 'google_verification_sent',
      success: true,
      ipAddress,
      userAgent,
      metadata: { 
        provider: 'google',
        reason: 'Security verification required',
      },
    });

    console.log('✅ Verification email sent to existing user');
    console.log('='.repeat(80));

    return {
      status: 'pending_verification',
      message: 'For security, please verify your email. Check your inbox to continue.',
      requiresAction: 'verify_email',
    };
  }

  /**
   * ✅ Main Google Auth handler (for client-side ID token flow)
   */
  async handleGoogleAuth(
    idToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GoogleAuthResult> {
    console.log('='.repeat(80));
    console.log('🔐 GOOGLE AUTH REQUEST');
    console.log('='.repeat(80));

    const googleUser = await this.validateIdToken(idToken, ipAddress);

    console.log('👤 Google User:', {
      email: googleUser.email,
      name: googleUser.name,
      sub: googleUser.sub,
      emailVerified: googleUser.email_verified,
    });

    // Step 1: Check if user exists in main users table
    const existingUser = await this.findUserByEmail(googleUser.email);

    if (existingUser) {
      console.log('✅ Existing user found in users table');
      return await this.handleExistingUser(existingUser, googleUser, ipAddress, userAgent);
    }

    // Step 2: Check if there's a pending temporary registration
    const tempRegistration = await this.findTemporaryRegistration(googleUser.sub);

    if (tempRegistration) {
      console.log('📧 Temporary registration found - resending verification');
      return await this.handlePendingRegistration(tempRegistration, googleUser, ipAddress, userAgent);
    }

    // Step 3: Create new temporary registration
    console.log('🆕 Creating new temporary registration');
    return await this.handleNewUser(googleUser, ipAddress, userAgent);
  }

  /**
   * ✅ Handle existing verified user (login)
   */
  private async handleExistingUser(
    existingUser: any,
    googleUser: GoogleTokenPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GoogleAuthResult> {
    console.log('🔍 Checking existing user auth provider...');

    // CRITICAL: Block Google login if email already registered with password
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

      console.log('❌ Google login blocked: Email already registered with password');
      console.log('='.repeat(80));

      throw new ConflictException({
        statusCode: 409,
        message: 'This email is already registered with a password. Please sign in using your email and password instead.',
        error: 'Conflict',
        action: 'use_email_password',
        email: existingUser.email,
      });
    }

    // Check/link OAuth account
    const oauthAccount = await this.findOAuthAccount('google', googleUser.sub);

    if (!oauthAccount) {
      console.log('🔗 Linking OAuth account to existing user');
      await this.linkOAuthAccount(existingUser.id, googleUser);
    }

    // Update last login
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
    console.log('='.repeat(80));

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

  /**
   * ✅ Handle pending registration (resend verification)
   */
  private async handlePendingRegistration(
    tempRegistration: any,
    googleUser: GoogleTokenPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GoogleAuthResult> {
    console.log('📧 Temporary registration exists:', {
      id: tempRegistration.id,
      email: tempRegistration.email,
      attempts: tempRegistration.attempts,
    });

    // Update attempt counter
    await this.updateTemporaryRegistrationAttempt(tempRegistration.id);

    // Resend verification email
    await sendGoogleVerificationEmail(
      tempRegistration.email,
      tempRegistration.verification_token,
      tempRegistration.name
    );

    await this.securityLogService.log({
      email: tempRegistration.email,
      eventType: 'google_verification_resent',
      success: true,
      ipAddress,
      userAgent,
      metadata: { 
        provider: 'google',
        attempts: tempRegistration.attempts + 1,
      },
    });

    console.log('✅ Verification email resent');
    console.log('='.repeat(80));

    return {
      status: 'pending_verification',
      message: 'Verification email resent. Please check your inbox to complete registration.',
      requiresAction: 'verify_email',
    };
  }

  /**
   * ✅ Handle new user (create temporary registration)
   */
  private async handleNewUser(
    googleUser: GoogleTokenPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GoogleAuthResult> {
    console.log('🆕 Creating new temporary registration for:', googleUser.email);

    // Generate verification token
    const verificationToken = this.generateSecureToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const registrationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    console.log('🔑 Verification token generated:', verificationToken.substring(0, 20) + '...');

    // Create temporary registration
    await this.createTemporaryRegistration({
      email: googleUser.email,
      name: googleUser.name,
      googleId: googleUser.sub,
      googleEmail: googleUser.email,
      googleName: googleUser.name,
      googlePicture: googleUser.picture,
      verificationToken,
      tokenExpiresAt,
      expiresAt: registrationExpiresAt,
    });

    console.log('✅ Temporary registration created');

    // Send verification email
    console.log('📧 Sending verification email...');
    await sendGoogleVerificationEmail(googleUser.email, verificationToken, googleUser.name);

    await this.securityLogService.log({
      email: googleUser.email,
      eventType: 'google_register_pending',
      success: true,
      ipAddress,
      userAgent,
      metadata: { 
        provider: 'google',
        emailVerified: false,
        pendingVerification: true,
      },
    });

    console.log('✅ New Google user - verification email sent');
    console.log('='.repeat(80));

    return {
      status: 'pending_verification',
      message: 'Account created successfully! Please check your email to verify your account before continuing.',
      requiresAction: 'verify_email',
    };
  }

  /**
   * ✅ Verify Google user and create actual account
   * This is called when user clicks verification link
   */
  async verifyGoogleUser(token: string, ipAddress?: string, userAgent?: string): Promise<{
    success: boolean;
    email: string;
    user: any;
  }> {
    try {
      console.log('='.repeat(80));
      console.log('🔍 VERIFYING GOOGLE USER');
      console.log('='.repeat(80));
      console.log('🔑 Token:', token.substring(0, 20) + '...');

      if (!token || token.length < 32) {
        throw new BadRequestException('Invalid verification token format');
      }

      // Find temporary registration
      const tempReg = await this.pool.query(
        `SELECT * FROM temporary_registrations 
         WHERE verification_token = $1 
         AND token_expires_at > NOW()`,
        [token]
      );

      if (tempReg.rows.length === 0) {
        console.error('❌ Invalid or expired token');

        // Check if token exists but expired
        const expiredCheck = await this.pool.query(
          `SELECT token_expires_at, email FROM temporary_registrations 
           WHERE verification_token = $1`,
          [token]
        );

        if (expiredCheck.rows.length > 0) {
          console.error('❌ Token expired at:', expiredCheck.rows[0].token_expires_at);
        }

        throw new BadRequestException('Invalid or expired verification token');
      }

      const registration = tempReg.rows[0];
      console.log('✅ Valid temporary registration found:', registration.email);

      // Check if user already exists (race condition protection OR existing user verification)
      const existingUser = await this.findUserByEmail(registration.email);

      if (existingUser) {
        console.log('✅ User already exists - completing verification for existing user');
        
        // Update user's verification status if needed
        if (!existingUser.email_verified) {
          await this.pool.query(
            'UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1',
            [existingUser.id]
          );
        }

        // Link Google account if not already linked
        const oauthAccount = await this.findOAuthAccount('google', registration.google_id);
        if (!oauthAccount) {
          await this.linkOAuthAccount(existingUser.id, {
            sub: registration.google_id,
            email: registration.google_email,
            name: registration.google_name,
            picture: registration.google_picture,
            email_verified: true,
            iat: 0,
            exp: 0,
            aud: '',
            iss: '',
          });
        }

        await this.deleteTemporaryRegistration(registration.id);

        await this.securityLogService.log({
          userId: existingUser.id,
          email: existingUser.email,
          eventType: 'google_email_verified',
          success: true,
          ipAddress,
          userAgent,
          metadata: { provider: 'google', type: 'existing_user' },
        });

        return {
          success: true,
          email: existingUser.email,
          user: {
            id: existingUser.id.toString(),
            email: existingUser.email,
            name: existingUser.name,
            emailVerified: true,
            authProvider: 'google',
          },
        };
      }

      // Create verified user in main users table (NEW USER)
      console.log('📝 Creating verified user account...');
      const newUser = await this.createVerifiedUserFromTemp(registration);

      console.log('✅ User created:', newUser.email);

      // Delete temporary registration
      console.log('🗑️ Deleting temporary registration...');
      await this.deleteTemporaryRegistration(registration.id);

      await this.securityLogService.log({
        userId: newUser.id,
        email: newUser.email,
        eventType: 'google_email_verified',
        success: true,
        ipAddress,
        userAgent,
        metadata: { provider: 'google', type: 'new_user' },
      });

      console.log('✅ Google user verified and created successfully');
      console.log('='.repeat(80));

      return {
        success: true,
        email: newUser.email,
        user: {
          id: newUser.id.toString(),
          email: newUser.email,
          name: newUser.name,
          emailVerified: true,
          authProvider: 'google',
        },
      };

    } catch (error) {
      console.error('❌ Error verifying Google user:', error);
      console.error('='.repeat(80));

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to verify Google user: ' + error.message);
    }
  }

  // ===== Private Helper Methods =====

  /**
   * Generate secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Find user by email in main users table
   */
  private async findUserByEmail(email: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by Google ID in main users table
   */
  private async findUserByGoogleId(googleId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE google_id = $1 AND email_verified = TRUE',
      [googleId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find OAuth account
   */
  private async findOAuthAccount(provider: string, providerUserId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2',
      [provider, providerUserId]
    );
    return result.rows[0] || null;
  }

  /**
   * Link OAuth account to user
   */
  private async linkOAuthAccount(userId: number, googleUser: GoogleTokenPayload): Promise<void> {
    await this.pool.query(
      `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (provider, provider_user_id) 
       DO UPDATE SET email = $4, email_verified = $5, updated_at = NOW()`,
      [userId, 'google', googleUser.sub, googleUser.email, googleUser.email_verified]
    );
  }

  /**
   * Find temporary registration by Google ID
   */
  private async findTemporaryRegistration(googleId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT * FROM temporary_registrations 
       WHERE google_id = $1 
       AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [googleId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Create temporary registration
   */
  private async createTemporaryRegistration(data: {
    email: string;
    name: string;
    googleId: string;
    googleEmail: string;
    googleName: string;
    googlePicture?: string;
    verificationToken: string;
    tokenExpiresAt: Date;
    expiresAt: Date;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO temporary_registrations 
       (email, name, google_id, google_email, google_name, google_picture, 
        verification_token, token_expires_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        data.email,
        data.name,
        data.googleId,
        data.googleEmail,
        data.googleName,
        data.googlePicture || null,
        data.verificationToken,
        data.tokenExpiresAt,
        data.expiresAt,
      ]
    );
  }

  /**
   * Update temporary registration attempt
   */
  private async updateTemporaryRegistrationAttempt(id: number): Promise<void> {
    await this.pool.query(
      `UPDATE temporary_registrations 
       SET attempts = attempts + 1,
           last_attempt_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Delete temporary registration
   */
  private async deleteTemporaryRegistration(id: number): Promise<void> {
    await this.pool.query(
      'DELETE FROM temporary_registrations WHERE id = $1',
      [id]
    );
  }

  /**
   * Create verified user from temporary registration
   */
  private async createVerifiedUserFromTemp(registration: any): Promise<any> {
    const result = await this.pool.query(
      `INSERT INTO users (email, name, google_id, auth_provider, email_verified, password)
       VALUES ($1, $2, $3, 'google', TRUE, NULL)
       RETURNING id, email, name, email_verified, auth_provider`,
      [registration.email, registration.name, registration.google_id]
    );

    const user = result.rows[0];

    // Link OAuth account
    await this.linkOAuthAccount(user.id, {
      sub: registration.google_id,
      email: registration.google_email,
      name: registration.google_name,
      email_verified: true,
      picture: registration.google_picture,
      iat: 0,
      exp: 0,
      aud: '',
      iss: '',
    });

    return user;
  }

  /**
   * Clean up expired temporary registrations
   */
  async cleanupExpiredRegistrations(): Promise<void> {
    try {
      console.log('🧹 Cleaning up expired temporary registrations...');

      const result = await this.pool.query(
        'DELETE FROM temporary_registrations WHERE expires_at < NOW() RETURNING id, email'
      );

      if (result.rowCount > 0) {
        console.log(`✅ Cleaned up ${result.rowCount} expired registrations`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up temporary registrations:', error);
    }
  }
}