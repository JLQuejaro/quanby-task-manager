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
      console.log(`📧 Preparing to send verification email to ${email} (User ID: ${userId})`);

      // Generate secure verification token (plain text for email)
      const verificationToken = this.generateSecureToken();
      const expiresAt = this.getTokenExpiry(24); // 24 hours

      // Hash token before storing in database
      const hashedToken = await this.hashToken(verificationToken);

      // Store hashed token in database
      await this.createVerificationToken(userId, hashedToken, expiresAt);

      // Send plain token to email (user clicks link with this)
      await sendEmailVerificationEmail(email, verificationToken, name);

      console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      console.error('❌ Error details:', error.message);
      throw new BadRequestException('Failed to send verification email: ' + error.message);
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: number): Promise<void> {
    try {
      console.log(`🔄 Resending verification email for user ID: ${userId}`);

      // Query with snake_case only
      const userResult = await this.pool.query(
        `SELECT 
          id,
          email, 
          name, 
          email_verified as is_verified
         FROM users 
         WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        console.error(`❌ User not found: ${userId}`);
        throw new BadRequestException('User not found');
      }

      const user = userResult.rows[0];
      console.log(`👤 Found user: ${user.email}`);

      if (user.is_verified) {
        console.log(`✅ Email already verified for: ${user.email}`);
        throw new BadRequestException('Email already verified');
      }

      // Check for recent verification email (prevent spam)
      const recentTokenResult = await this.pool.query(
        `SELECT created_at
         FROM email_verification_tokens 
         WHERE user_id = $1 
         AND created_at > NOW() - INTERVAL '2 minutes'
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );

      if (recentTokenResult.rows.length > 0) {
        console.log(`⏱️ Recent verification email already sent to: ${user.email}`);
        throw new BadRequestException('Please wait 2 minutes before requesting another verification email');
      }

      console.log(`📤 Sending new verification email to: ${user.email}`);
      await this.sendVerificationEmail(userId, user.email, user.name);
      
      console.log(`✅ Verification email resent successfully to: ${user.email}`);
    } catch (error) {
      console.error('❌ Error in resendVerificationEmail:', error);
      console.error('❌ Error stack:', error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to resend verification email: ' + error.message);
    }
  }

  /**
   * Verify email with token and generate JWT token for auto-login
   * CRITICAL FIX: Handle already-verified users gracefully
   */
  async verifyEmailAndGenerateToken(token: string): Promise<{
    success: boolean;
    email: string;
    access_token: string;
    user: any;
  }> {
    try {
      console.log('🔍 EmailVerificationService: Verifying token:', token.substring(0, 20) + '...');

      if (!token || token.length < 32) {
        console.error('❌ Invalid token format');
        throw new BadRequestException('Invalid verification token format');
      }

      // Hash the incoming token to match database
      const hashedToken = await this.hashToken(token);
      console.log('🔐 Hashed token for lookup:', hashedToken.substring(0, 20) + '...');

      // Validate token
      const tokenData = await this.validateVerificationToken(hashedToken);

      if (!tokenData) {
        console.error('❌ Token validation failed - checking if already verified...');
        
        // CRITICAL FIX: Check if token was already used successfully
        const usedTokenCheck = await this.checkIfTokenAlreadyUsed(hashedToken);
        
        if (usedTokenCheck && usedTokenCheck.emailVerified) {
          console.log('✅ Token already used but user is verified - returning success');
          
          // Get current user data
          const userData = await this.getUserData(usedTokenCheck.userId);
          
          // Generate new JWT token
          const payload = { sub: userData.id, email: userData.email };
          const accessToken = await this.jwtService.signAsync(payload);
          
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
        }
        
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
      console.error('❌ Email verification error:', error);
      console.error('❌ Error stack:', error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to verify email: ' + error.message);
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
      console.error('❌ Email verification error:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to verify email: ' + error.message);
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
      console.error('❌ Error checking email verification:', error);
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
      console.error('❌ Error checking pending verification:', error);
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
    try {
      console.log(`💾 Creating verification token for user ID: ${userId}`);

      // Invalidate existing tokens for this user
      const invalidateResult = await this.pool.query(
        'UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
        [userId]
      );
      
      console.log(`🔄 Invalidated ${invalidateResult.rowCount} old tokens`);

      // Create new verification token (store hashed version)
      const insertResult = await this.pool.query(
        'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id',
        [userId, hashedToken, expiresAt]
      );

      console.log(`✅ Created new verification token with ID: ${insertResult.rows[0].id}`);
    } catch (error) {
      console.error('❌ Error creating verification token:', error);
      console.error('❌ Error details:', error.message);
      throw new BadRequestException('Failed to create verification token: ' + error.message);
    }
  }

  /**
   * Validate verification token
   */
  private async validateVerificationToken(hashedToken: string): Promise<any> {
    try {
      console.log('🔍 Validating token in database...');

      const result = await this.pool.query(
        `SELECT 
          evt.*, 
          u.email, 
          u.id as user_id, 
          u.name, 
          u.auth_provider
         FROM email_verification_tokens evt
         JOIN users u ON u.id = evt.user_id
         WHERE evt.token = $1 
         AND evt.used_at IS NULL 
         AND evt.expires_at > NOW()`,
        [hashedToken]
      );

      if (result.rows.length === 0) {
        console.log('❌ No matching token found in database');
        
        // Check if token exists but is expired or used
        const expiredCheck = await this.pool.query(
          `SELECT 
            evt.expires_at, 
            evt.used_at,
            u.email
           FROM email_verification_tokens evt
           JOIN users u ON u.id = evt.user_id
           WHERE evt.token = $1`,
          [hashedToken]
        );

        if (expiredCheck.rows.length > 0) {
          const tokenInfo = expiredCheck.rows[0];
          if (tokenInfo.used_at) {
            console.log('❌ Token already used');
          } else if (new Date(tokenInfo.expires_at) < new Date()) {
            console.log('❌ Token expired at:', tokenInfo.expires_at);
          }
        } else {
          console.log('❌ Token does not exist in database at all');
        }
        
        return null;
      }

      console.log('✅ Token found in database for user:', result.rows[0].email);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error validating token:', error);
      console.error('❌ Error details:', error.message);
      throw error;
    }
  }

  /**
   * CRITICAL FIX: Check if token was already used and user is verified
   */
  private async checkIfTokenAlreadyUsed(hashedToken: string): Promise<{
    userId: number;
    emailVerified: boolean;
  } | null> {
    try {
      const result = await this.pool.query(
        `SELECT 
          evt.user_id,
          u.email_verified
         FROM email_verification_tokens evt
         JOIN users u ON u.id = evt.user_id
         WHERE evt.token = $1
         AND evt.used_at IS NOT NULL`,
        [hashedToken]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return {
        userId: result.rows[0].user_id,
        emailVerified: result.rows[0].email_verified,
      };
    } catch (error) {
      console.error('❌ Error checking if token already used:', error);
      return null;
    }
  }

  /**
   * Mark email as verified in users table
   */
  private async markEmailAsVerified(userId: number): Promise<void> {
    try {
      console.log(`📝 Marking email as verified for user ID: ${userId}`);

      const result = await this.pool.query(
        `UPDATE users 
         SET email_verified = TRUE,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, email`,
        [userId]
      );

      if (result.rowCount === 0) {
        throw new BadRequestException('User not found');
      }

      console.log(`✅ Email verified for user: ${result.rows[0].email}`);
    } catch (error) {
      console.error('❌ Error marking email as verified:', error);
      console.error('❌ Error details:', error.message);
      throw error;
    }
  }

  /**
   * Mark token as used
   */
  private async markTokenAsUsed(hashedToken: string): Promise<void> {
    try {
      console.log('🔒 Marking token as used...');

      const result = await this.pool.query(
        'UPDATE email_verification_tokens SET used_at = NOW() WHERE token = $1 RETURNING id',
        [hashedToken]
      );

      if (result.rowCount > 0) {
        console.log(`✅ Token marked as used (ID: ${result.rows[0].id})`);
      } else {
        console.log('⚠️ Token not found when marking as used');
      }
    } catch (error) {
      console.error('❌ Error marking token as used:', error);
      throw error;
    }
  }

  /**
   * Get user data by ID
   */
  private async getUserData(userId: number): Promise<any> {
    try {
      console.log(`👤 Fetching user data for ID: ${userId}`);

      const result = await this.pool.query(
        `SELECT 
          id, 
          email, 
          name, 
          email_verified,
          auth_provider
         FROM users 
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        console.error('❌ User not found:', userId);
        throw new BadRequestException('User not found');
      }

      console.log('✅ User data fetched:', result.rows[0].email);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      throw error;
    }
  }
}