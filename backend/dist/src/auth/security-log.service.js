"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityLogService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let SecurityLogService = class SecurityLogService {
    constructor() {
        this.pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }
    async log(data) {
        try {
            await this.pool.query(`INSERT INTO security_logs (user_id, email, event_type, success, ip_address, user_agent, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                data.userId || null,
                data.email || null,
                data.eventType,
                data.success,
                data.ipAddress || null,
                data.userAgent || null,
                data.metadata ? JSON.stringify(data.metadata) : null,
            ]);
            console.log(`📝 Security log: ${data.eventType} - ${data.success ? 'Success' : 'Failed'}`);
        }
        catch (error) {
            console.error('Error creating security log:', error);
        }
    }
    async getUserSecurityLogs(userId, limit = 50) {
        try {
            const result = await this.pool.query(`SELECT * FROM security_logs 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`, [userId, limit]);
            return result.rows;
        }
        catch (error) {
            console.error('Error fetching security logs:', error);
            return [];
        }
    }
    async getConsecutiveFailedPasswordChanges(userId) {
        try {
            const result = await this.pool.query(`SELECT event_type 
         FROM security_logs 
         WHERE user_id = $1 
           AND event_type IN ('password_change', 'password_change_failed') 
         ORDER BY created_at DESC 
         LIMIT 10`, [userId]);
            let count = 0;
            for (const row of result.rows) {
                if (row.event_type === 'password_change_failed') {
                    count++;
                }
                else {
                    break;
                }
            }
            return count;
        }
        catch (error) {
            console.error('Error counting consecutive password change failures:', error);
            return 0;
        }
    }
    async cleanup() {
        try {
            await this.pool.query(`DELETE FROM security_logs 
         WHERE created_at < NOW() - INTERVAL '90 days'`);
            console.log('🧹 Security logs cleanup completed');
        }
        catch (error) {
            console.error('Error cleaning up security logs:', error);
        }
    }
};
exports.SecurityLogService = SecurityLogService;
exports.SecurityLogService = SecurityLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SecurityLogService);
//# sourceMappingURL=security-log.service.js.map