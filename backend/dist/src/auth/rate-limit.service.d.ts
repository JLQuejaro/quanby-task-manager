export declare class RateLimitService {
    private pool;
    private readonly configs;
    constructor();
    checkRateLimit(identifier: string, endpoint: string): Promise<void>;
    resetRateLimit(identifier: string, endpoint: string): Promise<void>;
    cleanup(): Promise<void>;
}
