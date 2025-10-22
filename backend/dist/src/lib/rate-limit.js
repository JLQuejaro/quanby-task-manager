"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
const rateLimitMap = new Map();
function rateLimit(identifier, maxRequests = 3, windowMs = 60000) {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);
    if (!record || now > record.resetTime) {
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { success: true, remaining: maxRequests - 1 };
    }
    if (record.count >= maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetTime: record.resetTime,
        };
    }
    record.count++;
    return {
        success: true,
        remaining: maxRequests - record.count,
    };
}
//# sourceMappingURL=rate-limit.js.map