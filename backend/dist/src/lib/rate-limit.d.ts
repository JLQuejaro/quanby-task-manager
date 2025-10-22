export declare function rateLimit(identifier: string, maxRequests?: number, windowMs?: number): {
    success: boolean;
    remaining: number;
    resetTime?: undefined;
} | {
    success: boolean;
    remaining: number;
    resetTime: number;
};
