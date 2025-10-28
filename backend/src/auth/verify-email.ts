// File: src/routes/auth.routes.ts (or wherever your auth routes are)
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Replace these with your actual database queries
import { db } from '../database/db'; // Your database connection
import { users } from '../database/schema'; // Your user schema
import { eq } from 'drizzle-orm'; // Or your ORM's query builder

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * POST /api/auth/verify-email
 * Verify user's email with token
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    console.log('📧 Email verification request received');
    console.log('🔑 Token:', token?.substring(0, 20) + '...');

    // Validate token exists
    if (!token) {
      console.log('❌ No token provided');
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    // Find user with this verification token
    console.log('🔍 Looking up user with verification token...');
    
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token))
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

    // Check if already verified
    if (user.emailVerified) {
      console.log('ℹ️ Email already verified');
      // Still return success, just inform them
      return res.status(200).json({
        success: true,
        message: 'Email already verified',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: true,
        },
        access_token: jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '7d' }
        ),
      });
    }

    // Optional: Check if token is expired (if you have expiry field)
    // if (user.tokenExpiry && new Date() > new Date(user.tokenExpiry)) {
    //   console.log('❌ Token has expired');
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Verification token has expired. Please request a new one.',
    //   });
    // }

    // Update user as verified
    console.log('✍️ Marking email as verified...');
    
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        // tokenExpiry: null, // if you have this field
        updatedAt: new Date(), // if you have this field
      })
      .where(eq(users.id, user.id));

    console.log('✅ Email verified successfully!');

    // Generate JWT access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response with user data and token
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

  } catch (error) {
    console.error('❌ Email verification error:', error);
    
    // Log the full error for debugging
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

export default router;

// If you're using a different routing setup, make sure this is mounted:
// app.use('/api/auth', authRoutes);