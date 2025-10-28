"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const db_1 = require("../database/db");
const schema_1 = require("../database/schema");
const drizzle_orm_1 = require("drizzle-orm");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        console.log('📧 Email verification request received');
        console.log('🔑 Token:', token?.substring(0, 20) + '...');
        if (!token) {
            console.log('❌ No token provided');
            return res.status(400).json({
                success: false,
                message: 'Verification token is required',
            });
        }
        console.log('🔍 Looking up user with verification token...');
        const userResult = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.verificationToken, token))
            .limit(1);
        if (!userResult || userResult.length === 0) {
            console.log('❌ No user found with this token');
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token',
            });
        }
        const user = userResult[0];
        console.log('✅ User found:', user.email);
        if (user.emailVerified) {
            console.log('ℹ️ Email already verified');
            return res.status(200).json({
                success: true,
                message: 'Email already verified',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    emailVerified: true,
                },
                access_token: jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' }),
            });
        }
        console.log('✍️ Marking email as verified...');
        await db_1.db
            .update(schema_1.users)
            .set({
            emailVerified: true,
            verificationToken: null,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        console.log('✅ Email verified successfully!');
        const accessToken = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
        }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                emailVerified: true,
            },
            access_token: accessToken,
        });
    }
    catch (error) {
        console.error('❌ Email verification error:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error during email verification',
            error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        });
    }
});
exports.default = router;
//# sourceMappingURL=verify-email.js.map