export declare function createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<any>;
export declare function validateResetToken(token: string): Promise<any>;
export declare function markTokenAsUsed(token: string): Promise<void>;
export declare function getUserByEmail(email: string): Promise<any>;
export declare function updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
