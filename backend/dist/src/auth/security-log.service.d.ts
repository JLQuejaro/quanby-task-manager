interface SecurityLogData {
    userId?: number;
    email?: string;
    eventType: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
}
export declare class SecurityLogService {
    private pool;
    constructor();
    log(data: SecurityLogData): Promise<void>;
    getUserSecurityLogs(userId: number, limit?: number): Promise<any[]>;
    getConsecutiveFailedPasswordChanges(userId: number): Promise<number>;
    cleanup(): Promise<void>;
}
export {};
