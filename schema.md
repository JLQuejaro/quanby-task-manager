# System Schema Documentation

This document outlines the database schema for the Quanby Task Manager application. The system uses a PostgreSQL database, managed partly by Drizzle ORM and partly by raw SQL migrations.

## Overview

The schema is designed to support:
-   **User Management**: Registration, login, and profile management.
-   **Authentication**: Email/password and Google OAuth flows, including temporary registrations for verification.
-   **Security**: Rate limiting, security logging, and session management.
-   **Task Management**: CRUD operations for tasks, including archiving.

## Tables

### 1. User Management

#### `users`
Stores user account information.
*Managed by Drizzle & SQL*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique user identifier. |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User's email address. |
| `password` | VARCHAR(255) | NULL | Hashed password. Nullable for OAuth users. |
| `name` | VARCHAR(255) | NOT NULL | User's full name. |
| `auth_provider` | VARCHAR(20) | DEFAULT 'email' | Authentication method ('email', 'google'). |
| `google_id` | VARCHAR(255) | UNIQUE | Google User ID (if linked). |
| `email_verified` | BOOLEAN | DEFAULT FALSE | Whether the email has been verified. |
| `verification_token` | VARCHAR(255) | | Token for email verification. |
| `last_password_change` | TIMESTAMP | | Timestamp of the last password change. |
| `created_at` | TIMESTAMP | DEFAULT NOW(), NOT NULL | Account creation timestamp. |
| `updated_at` | TIMESTAMP | DEFAULT NOW(), NOT NULL | Last update timestamp. |

#### `oauth_accounts`
Links external OAuth provider accounts to internal users.
*Managed by SQL*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique identifier. |
| `user_id` | INTEGER | NOT NULL, FK -> users(id) | Reference to the user. |
| `provider` | VARCHAR(50) | NOT NULL | Provider name (e.g., 'google'). |
| `provider_user_id` | VARCHAR(255) | NOT NULL | User ID from the provider. |
| `email` | VARCHAR(255) | | Email associated with the OAuth account. |
| `email_verified` | BOOLEAN | DEFAULT FALSE | Verification status from provider. |
| `access_token` | TEXT | | OAuth access token. |
| `refresh_token` | TEXT | | OAuth refresh token. |
| `token_expires_at` | TIMESTAMP | | Expiration of the access token. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp. |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Record update timestamp. |
| **Unique Constraint** | | | `(provider, provider_user_id)` |

#### `temporary_registrations`
Stores data for unverified Google OAuth registrations.
*Managed by Drizzle*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique identifier. |
| `email` | VARCHAR(255) | NOT NULL | Email address. |
| `name` | VARCHAR(255) | NOT NULL | User's name. |
| `google_id` | VARCHAR(255) | NOT NULL, UNIQUE | Google User ID. |
| `google_email` | VARCHAR(255) | | Email from Google. |
| `google_name` | VARCHAR(255) | | Name from Google. |
| `google_picture` | TEXT | | Profile picture URL. |
| `verification_token` | VARCHAR(255) | NOT NULL, UNIQUE | Token for verifying the registration. |
| `token_expires_at` | TIMESTAMP | NOT NULL | Expiration of the verification token. |
| `attempts` | INTEGER | DEFAULT 1, NOT NULL | Login attempt counter. |
| `last_attempt_at` | TIMESTAMP | DEFAULT NOW(), NOT NULL | Timestamp of last attempt. |
| `created_at` | TIMESTAMP | DEFAULT NOW(), NOT NULL | Creation timestamp. |
| `expires_at` | TIMESTAMP | NOT NULL | Expiration of the temporary record (auto-cleanup). |

---

### 2. Task Management

#### `tasks`
Stores active tasks.
*Managed by Drizzle*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique task identifier. |
| `title` | VARCHAR(255) | NOT NULL | Task title. |
| `description` | TEXT | | Detailed description of the task. |
| `priority` | VARCHAR(20) | NOT NULL, DEFAULT 'medium' | Task priority ('low', 'medium', 'high'). |
| `deadline` | TIMESTAMP | | Due date/time for the task. |
| `completed` | BOOLEAN | DEFAULT FALSE, NOT NULL | Completion status. |
| `user_id` | INTEGER | NOT NULL, FK -> users(id) | Owner of the task. |
| `created_at` | TIMESTAMP | DEFAULT NOW(), NOT NULL | Creation timestamp. |
| `updated_at` | TIMESTAMP | DEFAULT NOW(), NOT NULL | Last update timestamp. |

#### `archived_tasks`
Stores soft-deleted tasks (Trash).
*Managed by Drizzle*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique archive identifier. |
| `original_task_id` | INTEGER | NOT NULL | ID of the task before archiving. |
| `title` | VARCHAR(255) | NOT NULL | Task title. |
| `description` | TEXT | | Task description. |
| `priority` | VARCHAR(20) | NOT NULL, DEFAULT 'medium' | Task priority. |
| `deadline` | TIMESTAMP | | Task deadline. |
| `completed` | BOOLEAN | DEFAULT FALSE, NOT NULL | Completion status. |
| `user_id` | INTEGER | NOT NULL, FK -> users(id) | Owner of the task. |
| `deleted_at` | TIMESTAMP | DEFAULT NOW(), NOT NULL | When the task was archived. |
| `expires_at` | TIMESTAMP | NOT NULL | When the task will be permanently deleted. |
| `original_created_at` | TIMESTAMP | | Original creation time. |
| `original_updated_at` | TIMESTAMP | | Original update time. |
| `created_at` | TIMESTAMP | DEFAULT NOW(), NOT NULL | Archive record creation time. |

---

### 3. Security & Authentication

#### `active_sessions`
Manages user sessions for multi-device support.
*Managed by SQL*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique session identifier. |
| `user_id` | INTEGER | NOT NULL, FK -> users(id) | User owning the session. |
| `token_hash` | VARCHAR(255) | NOT NULL | Hash of the session token. |
| `device_info` | TEXT | | Information about the client device. |
| `ip_address` | VARCHAR(45) | | IP address of the client. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Session creation time. |
| `expires_at` | TIMESTAMP | NOT NULL | Session expiration time. |
| `last_activity` | TIMESTAMP | DEFAULT NOW() | Last activity timestamp. |
| `is_revoked` | BOOLEAN | DEFAULT FALSE | Whether the session is revoked. |

#### `security_logs`
Audit trail for security-related events (logins, failures, etc.).
*Managed by SQL*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique log identifier. |
| `user_id` | INTEGER | FK -> users(id) | User ID (if known/applicable). |
| `email` | VARCHAR(255) | | Email associated with the event. |
| `event_type` | VARCHAR(50) | NOT NULL | Type of event (e.g., 'login', 'register_failed'). |
| `success` | BOOLEAN | DEFAULT TRUE | Outcome of the event. |
| `ip_address` | VARCHAR(45) | | Client IP address. |
| `user_agent` | TEXT | | Client User Agent. |
| `metadata` | JSONB | | Additional event details. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Event timestamp. |

#### `rate_limits`
Tracks rate limiting usage.
*Managed by SQL*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique identifier. |
| `identifier` | VARCHAR(255) | NOT NULL | Client identifier (e.g., IP or User ID). |
| `endpoint` | VARCHAR(100) | NOT NULL | API endpoint being accessed. |
| `attempt_count` | INTEGER | DEFAULT 1 | Number of attempts. |
| `first_attempt` | TIMESTAMP | DEFAULT NOW() | Time of first attempt in window. |
| `last_attempt` | TIMESTAMP | DEFAULT NOW() | Time of most recent attempt. |
| `locked_until` | TIMESTAMP | | Time until which the client is blocked. |
| **Unique Constraint** | | | `(identifier, endpoint)` |

#### `email_verification_tokens`
Stores tokens for email verification flows.
*Managed by SQL*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique identifier. |
| `user_id` | INTEGER | NOT NULL, FK -> users(id) | User associated with the token. |
| `token` | VARCHAR(255) | NOT NULL, UNIQUE | The verification token. |
| `expires_at` | TIMESTAMP | NOT NULL | Token expiration time. |
| `used_at` | TIMESTAMP | | When the token was used. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp. |

#### `password_reset_tokens`
Stores tokens for password reset flows.
*Managed by SQL*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique identifier. |
| `user_id` | INTEGER | NOT NULL, FK -> users(id) | User associated with the token. |
| `token` | VARCHAR(255) | NOT NULL, UNIQUE | The reset token. |
| `expires_at` | TIMESTAMP | NOT NULL | Token expiration time. |
| `used_at` | TIMESTAMP | | When the token was used. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp. |
