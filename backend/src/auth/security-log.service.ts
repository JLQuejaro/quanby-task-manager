import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

interface SecurityLogData {
  userId?: number;
  email?: string;
  eventType: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

@Injectable()
export class SecurityLogService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async log(data: SecurityLogData): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO security_logs (user_id, email, event_type, success, ip_address, user_agent, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          data.userId || null,
          data.email || null,
          data.eventType,
          data.success,
          data.ipAddress || null,
          data.userAgent || null,
          data.metadata ? JSON.stringify(data.metadata) : null,
        ]
      );

      console.log(`📝 Security log: ${data.eventType} - ${data.success ? 'Success' : 'Failed'}`);
    } catch (error) {
      console.error('Error creating security log:', error);
    }
  }

  async getUserSecurityLogs(userId: number, limit: number = 50): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM security_logs 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching security logs:', error);
      return [];
    }
  }

  async getConsecutiveFailedPasswordChanges(userId: number): Promise<number> {
    try {
      // Fetch the last 10 events related to password changes to calculate streak
      const result = await this.pool.query(
        `SELECT event_type 
         FROM security_logs 
         WHERE user_id = $1 
           AND event_type IN ('password_change', 'password_change_failed') 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [userId]
      );

      let count = 0;
      for (const row of result.rows) {
        if (row.event_type === 'password_change_failed') {
          count++;
        } else {
          // Break sequence if we hit a success
          break;
        }
      }

      return count;
    } catch (error) {
      console.error('Error counting consecutive password change failures:', error);
      return 0;
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.pool.query(
        `DELETE FROM security_logs 
         WHERE created_at < NOW() - INTERVAL '90 days'`
      );
      console.log('🧹 Security logs cleanup completed');
    } catch (error) {
      console.error('Error cleaning up security logs:', error);
    }
  }
}