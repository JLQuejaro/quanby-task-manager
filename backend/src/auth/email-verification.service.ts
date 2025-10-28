import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import { sendEmailVerificationEmail } from '../lib/email';

@Injectable()
export class EmailVerificationService {
  private pool: Pool;

  constructor(private jwtService: JwtService) {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Send email verification to user
   */
  async sendVerificationEmail(userId: number, email: string, name?: string): Promise<void> {
    try {
      // Generate secure verification token (plain text for email)
      const verificationToken = this.generateSecureToken();
      const expiresAt = this.getTokenExpiry(24); // 24 hours

      // Hash token before storing in database
      const hashedToken = await this.hashToken(verificationToken);

      // Store hashed token in database
      await this.createVerificationToken(userId, hashedToken, expiresAt);

      // Send plain token to email (user clicks link with this)
      await sendEmailVerificationEmail(email, verificationToken, name);

      console.log(`📧 Verification email sent to ${email}`);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new BadRequestException('Failed to send verification email');
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: number): Promise<void> {
    try {
      const userResult = await this.pool.query(
        'SELECT email, name, email_verified FROM users WHERE id = $1',
        [userId]
      );

      const user = userResult.rows[0];
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.email_verified) {
        throw new BadRequestException('Email already verified');
      }

      // Check for recent verification email (prevent spam)
      const recentTokenResult = await this.pool.query(
        `SELECT created_at FROM email_verification_tokens 
         WHERE user_id = $1 
         AND created_at > NOW() - INTERVAL '2 minutes'
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      if (recentTokenResult.rows.length > 0) {
        throw new BadRequestException('Please wait before requesting another verification email');
      }

      await this.sendVerificationEmail(userId, user.email, user.name);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error resending verification email:', error);
      throw new BadRequestException('Failed to resend verification email');
    }
  }

  /**
   * Verify email with token and generate JWT token for auto-login
   */
  async verifyEmailAndGenerateToken(token: string): Promise<{
    success: boolean;
    email: string;
    access_token: string;
    user: any;
  }> {
    try {
      console.log('🔍 EmailVerificationService: Verifying token:', token.substring(0, 20) + '...');

      // Hash the incoming token to match database
      const hashedToken = await this.hashToken(token);
      console.log('🔐 Hashed token for lookup:', hashedToken.substring(0, 20) + '...');

      // Validate token
      const tokenData = await this.validateVerificationToken(hashedToken);

      if (!tokenData) {
        console.error('❌ Token validation failed - not found or expired');
        throw new BadRequestException('Invalid or expired verification token');
      }

      console.log('✅ Token valid for user:', tokenData.email);

      // Mark email as verified
      await this.markEmailAsVerified(tokenData.user_id);
      console.log('✅ Email marked as verified');

      // Mark token as used
      await this.markTokenAsUsed(hashedToken);
      console.log('✅ Token marked as used');

      // Get updated user data
      const userData = await this.getUserData(tokenData.user_id);
      console.log('✅ User data retrieved:', userData.email);

      // Generate JWT access token for auto-login
      const payload = { sub: userData.id, email: userData.email };
      const accessToken = await this.jwtService.signAsync(payload);
      console.log('✅ JWT token generated');

      return {
        success: true,
        email: userData.email,
        access_token: accessToken,
        user: {
          id: userData.id.toString(),
          email: userData.email,
          name: userData.name,
          emailVerified: true,
          authProvider: userData.auth_provider || 'email',
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Email verification error:', error);
      throw new BadRequestException('Failed to verify email');
    }
  }

  /**
   * Verify email with token (simple version without JWT generation)
   */
  async verifyEmail(token: string): Promise<{ userId: number; email: string }> {
    try {
      // Hash the incoming token
      const hashedToken = await this.hashToken(token);

      // Validate token
      const tokenData = await this.validateVerificationToken(hashedToken);

      if (!tokenData) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      // Mark email as verified
      await this.markEmailAsVerified(tokenData.user_id);

      // Mark token as used
      await this.markTokenAsUsed(hashedToken);

      console.log(`✅ Email verified for user ID: ${tokenData.user_id}`);

      return {
        userId: tokenData.user_id,
        email: tokenData.email,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Email verification error:', error);
      throw new BadRequestException('Failed to verify email');
    }
  }

  /**
   * Check if email is verified
   */
  async isEmailVerified(userId: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'SELECT email_verified FROM users WHERE id = $1',
        [userId]
      );

      return result.rows[0]?.email_verified || false;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  }

  /**
   * Check if user has pending verification
   */
  async hasPendingVerification(userId: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT COUNT(*) as count 
         FROM email_verification_tokens 
         WHERE user_id = $1 
         AND used_at IS NULL 
         AND expires_at > NOW()`,
        [userId]
      );

      return parseInt(result.rows[0]?.count || '0') > 0;
    } catch (error) {
      console.error('Error checking pending verification:', error);
      return false;
    }
  }

  // ===== Private Helper Methods =====

  /**
   * Generate secure random token (64 hex characters)
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash token using SHA-256
   */
  private async hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Get token expiry time
   */
  private getTokenExpiry(hours: number): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);
    return expiry;
  }

  /**
   * Create verification token in database
   */
  private async createVerificationToken(
    userId: number,
    hashedToken: string,
    expiresAt: Date,
  ): Promise<void> {
    // Invalidate existing tokens for this user
    await this.pool.query(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [userId]
    );

    // Create new verification token (store hashed version)
    await this.pool.query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, hashedToken, expiresAt]
    );
  }

  /**
   * Validate verification token
   */
  private async validateVerificationToken(hashedToken: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT evt.*, u.email, u.id as user_id, u.name, u.auth_provider
       FROM email_verification_tokens evt
       JOIN users u ON u.id = evt.user_id
       WHERE evt.token = $1 
       AND evt.used_at IS NULL 
       AND evt.expires_at > NOW()`,
      [hashedToken]
    );

    return result.rows[0] || null;
  }

  /**
   * Mark email as verified in users table
   */
  private async markEmailAsVerified(userId: number): Promise<void> {
    await this.pool.query(
      'UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  /**
   * Mark token as used
   */
  private async markTokenAsUsed(hashedToken: string): Promise<void> {
    await this.pool.query(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE token = $1',
      [hashedToken]
    );
  }

  /**
   * Get user data by ID
   */
  private async getUserData(userId: number): Promise<any> {
    const result = await this.pool.query(
      'SELECT id, email, name, email_verified, auth_provider FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('User not found');
    }

    return result.rows[0];
  }
}