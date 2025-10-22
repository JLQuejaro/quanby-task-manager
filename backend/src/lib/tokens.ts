import * as crypto from 'crypto';

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getTokenExpiry(): Date {
  const hours = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY || '1');
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
}