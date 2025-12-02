import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail, sendAccountLockedEmail } from '../lib/email';

@Injectable()
export class PasswordResetService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async lockAccountAndSendResetEmail(userId: number, email: string, name: string): Promise<void> {
    try {
      // Generate reset token
      const resetToken = this.generateSecureToken();
      const hashedToken = await this.hashToken(resetToken);
      const expiresAt = this.getTokenExpiry(
        parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY || '1')
      );

      // Store reset token
      await this.createResetToken(userId, hashedToken, expiresAt);

      // Send account locked email
      await sendAccountLockedEmail(email, resetToken, name);

      console.log(`🚨 Account locked email sent to ${email}`);
    } catch (error) {
      console.error('Error in lockAccountAndSendResetEmail:', error);
      // Don't throw here to ensure the logout process continues in the caller
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      // Check if user exists
      const userResult = await this.pool.query(
        'SELECT id, name, email, password FROM users WHERE email = $1',
        [email]
      );

      const user = userResult.rows[0];

      // Always return success message for security (don't reveal if email exists)
      if (!user) {
        console.log(`⚠️ Password reset requested for non-existent email: ${email}`);
        return {
          message: 'If an account exists with this email, a password reset link has been sent.',
        };
      }

      // Check if user has a password set
      if (!user.password) {
        console.log(`⚠️ Password reset requested for OAuth-only account: ${email}`);
        return {
          message: 'If an account exists with this email, a password reset link has been sent.',
        };
      }

      // Generate reset token
      const resetToken = this.generateSecureToken();
      const hashedToken = await this.hashToken(resetToken);
      const expiresAt = this.getTokenExpiry(
        parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY || '1')
      );

      // Store reset token
      await this.createResetToken(user.id, hashedToken, expiresAt);

      // Send reset email
      await sendPasswordResetEmail(email, resetToken, user.name);

      console.log(`📧 Password reset email sent to ${email}`);

      return {
        message: 'If an account exists with this email, a password reset link has been sent.',
      };
    } catch (error) {
      console.error('Error in forgotPassword:', error);
      throw new BadRequestException('Failed to process password reset request');
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      // Validate password strength
      this.validatePasswordStrength(newPassword);

      // Hash and validate token
      const hashedToken = await this.hashToken(token);
      const tokenData = await this.validateResetToken(hashedToken);

      if (!tokenData) {
        throw new UnauthorizedException('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await this.pool.query(
        `UPDATE users 
         SET password = $1, 
             last_password_change = NOW(),
             updated_at = NOW() 
         WHERE id = $2`,
        [hashedPassword, tokenData.user_id]
      );

      // Mark token as used
      await this.markTokenAsUsed(hashedToken);

      // Revoke all active sessions for security
      await this.revokeAllUserSessions(tokenData.user_id);

      // Send confirmation email
      await sendPasswordResetSuccessEmail(tokenData.email, tokenData.name).catch(err => {
        console.error('Failed to send password reset success email:', err);
      });

      console.log(`✅ Password reset successful for user ID: ${tokenData.user_id}`);

      return {
        message: 'Password reset successful. You can now log in with your new password.',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error in resetPassword:', error);
      throw new BadRequestException('Failed to reset password');
    }
  }

  async hasActiveResetToken(userId: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT COUNT(*) as count 
         FROM password_reset_tokens 
         WHERE user_id = $1 
         AND used_at IS NULL 
         AND expires_at > NOW()`,
        [userId]
      );
      return parseInt(result.rows[0]?.count || '0') > 0;
    } catch (error) {
      console.error('Error checking active reset token:', error);
      return false;
    }
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getTokenExpiry(hours: number): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);
    return expiry;
  }

  private async createResetToken(
    userId: number,
    hashedToken: string,
    expiresAt: Date,
  ): Promise<void> {
    // Invalidate any existing unused tokens
    await this.pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [userId]
    );

    // Create new reset token
    await this.pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, hashedToken, expiresAt]
    );
  }

  private async validateResetToken(hashedToken: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT prt.*, u.id as user_id, u.email 
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1 
       AND prt.used_at IS NULL 
       AND prt.expires_at > NOW()`,
      [hashedToken]
    );
    return result.rows[0] || null;
  }

  private async markTokenAsUsed(hashedToken: string): Promise<void> {
    await this.pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1',
      [hashedToken]
    );
  }

  private async revokeAllUserSessions(userId: number): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE active_sessions 
         SET is_revoked = TRUE 
         WHERE user_id = $1 AND is_revoked = FALSE`,
        [userId]
      );
      console.log(`🔒 All sessions revoked for user ID: ${userId} (password reset)`);
    } catch (error) {
      console.error('Error revoking sessions:', error);
    }
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.pool.query(
        `DELETE FROM password_reset_tokens 
         WHERE expires_at < NOW() - INTERVAL '7 days'`
      );
      console.log('🧹 Password reset tokens cleanup completed');
    } catch (error) {
      console.error('Error cleaning up password reset tokens:', error);
    }
  }
}