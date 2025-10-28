-- Migration: Add email verification and security features

-- 1. Add email_verified column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP;

-- 2. Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evt_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_evt_user_id ON email_verification_tokens(user_id);

-- 3. Create password reset tokens table (if not exists)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);

-- 4. Create security logs table for audit trail
CREATE TABLE IF NOT EXISTS security_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  event_type VARCHAR(50) NOT NULL,
  success BOOLEAN DEFAULT TRUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sl_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sl_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sl_created_at ON security_logs(created_at);

-- 5. Create rate limit tracking table
CREATE TABLE IF NOT EXISTS rate_limits (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  first_attempt TIMESTAMP DEFAULT NOW(),
  last_attempt TIMESTAMP DEFAULT NOW(),
  locked_until TIMESTAMP,
  UNIQUE(identifier, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rl_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rl_locked_until ON rate_limits(locked_until);

-- 6. Create active sessions table
CREATE TABLE IF NOT EXISTS active_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  device_info TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT NOW(),
  is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_as_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_as_token_hash ON active_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_as_expires_at ON active_sessions(expires_at);

-- 7. Create OAuth accounts table
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oa_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oa_provider_user_id ON oauth_accounts(provider, provider_user_id);

-- Add comments
COMMENT ON TABLE email_verification_tokens IS 'Stores email verification tokens for new accounts';
COMMENT ON TABLE security_logs IS 'Audit trail for security-related events';
COMMENT ON TABLE rate_limits IS 'Tracks rate limiting per identifier and endpoint';
COMMENT ON TABLE active_sessions IS 'Manages user sessions for multi-device support';
COMMENT ON TABLE oauth_accounts IS 'Links OAuth provider accounts to user accounts';