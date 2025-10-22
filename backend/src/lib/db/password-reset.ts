import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function createPasswordResetToken(
  userId: number,
  token: string,
  expiresAt: Date
) {
  // Invalidate any existing tokens for this user
  await pool.query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
    [userId]
  );

  // Create new token
  const result = await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id',
    [userId, token, expiresAt]
  );

  return result.rows[0];
}

export async function validateResetToken(token: string) {
  const result = await pool.query(
    `SELECT prt.*, u.email, u.id as user_id, u.name 
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE prt.token = $1 
     AND prt.used_at IS NULL 
     AND prt.expires_at > NOW()`,
    [token]
  );

  return result.rows[0] || null;
}

export async function markTokenAsUsed(token: string) {
  await pool.query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1',
    [token]
  );
}

export async function getUserByEmail(email: string) {
  const result = await pool.query(
    'SELECT id, email, name FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

export async function updateUserPassword(userId: number, hashedPassword: string) {
  await pool.query(
    'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, userId]
  );
}