import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { generateResetToken, getTokenExpiry } from '../lib/tokens';
import { sendPasswordResetEmail } from '../lib/email';

@Injectable()
export class PasswordResetService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const user = await this.getUserByEmail(email.toLowerCase());

      // Always return success (security best practice - prevents email enumeration)
      if (!user) {
        return {
          message: 'If an account exists with this email, a reset link has been sent.',
        };
      }

      const resetToken = generateResetToken();
      const expiresAt = getTokenExpiry();

      await this.createPasswordResetToken(user.id, resetToken, expiresAt);
      await sendPasswordResetEmail(user.email, resetToken, user.name);

      return {
        message: 'If an account exists with this email, a reset link has been sent.',
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      throw new InternalServerErrorException('An error occurred. Please try again later.');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const tokenData = await this.validateResetToken(token);

      if (!tokenData) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.updateUserPassword(tokenData.user_id, hashedPassword);
      await this.markTokenAsUsed(token);

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Reset password error:', error);
      throw new InternalServerErrorException('An error occurred. Please try again later.');
    }
  }

  // Private helper methods
  private async createPasswordResetToken(
    userId: number,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    // Invalidate existing tokens
    await this.pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [userId],
    );

    // Create new token
    await this.pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt],
    );
  }

  private async validateResetToken(token: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT prt.*, u.email, u.id as user_id, u.name 
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1 
       AND prt.used_at IS NULL 
       AND prt.expires_at > NOW()`,
      [token],
    );

    return result.rows[0] || null;
  }

  private async markTokenAsUsed(token: string): Promise<void> {
    await this.pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1',
      [token],
    );
  }

  private async getUserByEmail(email: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email],
    );
    return result.rows[0] || null;
  }

  private async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await this.pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId],
    );
  }
}