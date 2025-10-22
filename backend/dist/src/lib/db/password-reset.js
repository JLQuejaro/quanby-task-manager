"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPasswordResetToken = createPasswordResetToken;
exports.validateResetToken = validateResetToken;
exports.markTokenAsUsed = markTokenAsUsed;
exports.getUserByEmail = getUserByEmail;
exports.updateUserPassword = updateUserPassword;
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
async function createPasswordResetToken(userId, token, expiresAt) {
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [userId]);
    const result = await pool.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id', [userId, token, expiresAt]);
    return result.rows[0];
}
async function validateResetToken(token) {
    const result = await pool.query(`SELECT prt.*, u.email, u.id as user_id, u.name 
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE prt.token = $1 
     AND prt.used_at IS NULL 
     AND prt.expires_at > NOW()`, [token]);
    return result.rows[0] || null;
}
async function markTokenAsUsed(token) {
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1', [token]);
}
async function getUserByEmail(email) {
    const result = await pool.query('SELECT id, email, name FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
}
async function updateUserPassword(userId, hashedPassword) {
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
}
//# sourceMappingURL=password-reset.js.map