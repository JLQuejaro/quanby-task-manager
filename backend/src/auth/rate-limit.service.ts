import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Pool } from 'pg';

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  lockoutMinutes?: number;
}

@Injectable()
export class RateLimitService {
  private pool: Pool;

  private readonly configs: Record<string, RateLimitConfig> = {
    'oauth_callback': { maxAttempts: 10, windowMinutes: 15, lockoutMinutes: 30 },
    'email_verification': { maxAttempts: 5, windowMinutes: 60, lockoutMinutes: 60 },
    'password_reset': { maxAttempts: 5, windowMinutes: 60, lockoutMinutes: 60 },
    'password_change': { maxAttempts: 5, windowMinutes: 15, lockoutMinutes: 30 },
    'login': { maxAttempts: 10, windowMinutes: 15, lockoutMinutes: 30 },
    'register': { maxAttempts: 5, windowMinutes: 60, lockoutMinutes: 60 },
  };

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async checkRateLimit(identifier: string, endpoint: string): Promise<void> {
    const config = this.configs[endpoint] || { maxAttempts: 10, windowMinutes: 15, lockoutMinutes: 30 };

    const lockResult = await this.pool.query(
      `SELECT locked_until FROM rate_limits 
       WHERE identifier = $1 AND endpoint = $2 
       AND locked_until > NOW()`,
      [identifier, endpoint]
    );

    if (lockResult.rows.length > 0) {
      const lockedUntil = new Date(lockResult.rows[0].locked_until);
      const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many attempts. Please try again in ${minutesLeft} minute(s).`,
          lockedUntil: lockedUntil.toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const result = await this.pool.query(
      `SELECT attempt_count, first_attempt 
       FROM rate_limits 
       WHERE identifier = $1 AND endpoint = $2
       AND first_attempt > NOW() - INTERVAL '${config.windowMinutes} minutes'`,
      [identifier, endpoint]
    );

    if (result.rows.length > 0) {
      const currentAttempts = result.rows[0].attempt_count;

      if (currentAttempts >= config.maxAttempts) {
        const lockoutMinutes = config.lockoutMinutes || 30;
        await this.pool.query(
          `UPDATE rate_limits 
           SET locked_until = NOW() + INTERVAL '${lockoutMinutes} minutes',
               last_attempt = NOW()
           WHERE identifier = $1 AND endpoint = $2`,
          [identifier, endpoint]
        );

        console.log(`🚫 Rate limit exceeded for ${identifier} on ${endpoint}`);

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many attempts. Please try again in ${lockoutMinutes} minute(s).`,
            lockedUntil: new Date(Date.now() + lockoutMinutes * 60000).toISOString(),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      await this.pool.query(
        `UPDATE rate_limits 
         SET attempt_count = attempt_count + 1,
             last_attempt = NOW()
         WHERE identifier = $1 AND endpoint = $2`,
        [identifier, endpoint]
      );
    } else {
      await this.pool.query(
        `INSERT INTO rate_limits (identifier, endpoint, attempt_count)
         VALUES ($1, $2, 1)
         ON CONFLICT (identifier, endpoint) 
         DO UPDATE SET 
           attempt_count = 1,
           first_attempt = NOW(),
           last_attempt = NOW(),
           locked_until = NULL`,
        [identifier, endpoint]
      );
    }
  }

  async resetRateLimit(identifier: string, endpoint: string): Promise<void> {
    try {
      await this.pool.query(
        `DELETE FROM rate_limits 
         WHERE identifier = $1 AND endpoint = $2`,
        [identifier, endpoint]
      );
      console.log(`✅ Rate limit reset for ${identifier} on ${endpoint}`);
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.pool.query(
        `DELETE FROM rate_limits 
         WHERE first_attempt < NOW() - INTERVAL '24 hours'
         AND (locked_until IS NULL OR locked_until < NOW())`
      );
      console.log('🧹 Rate limit cleanup completed');
    } catch (error) {
      console.error('Error cleaning up rate limits:', error);
    }
  }
}