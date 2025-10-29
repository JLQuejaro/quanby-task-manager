import { pgTable, serial, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }), // Nullable for Google OAuth
  name: varchar('name', { length: 255 }).notNull(),
  
  // Auth fields
  authProvider: varchar('auth_provider', { length: 20 }).default('email'),
  googleId: varchar('google_id', { length: 255 }),
  
  // Email verification fields - CRITICAL for email verification
  emailVerified: boolean('email_verified').default(false),
  verificationToken: varchar('verification_token', { length: 255 }), // ⚠️ YOU WERE MISSING THIS!
  
  // Optional but recommended: Token expiry for security
  // tokenExpiry: timestamp('token_expiry'),
  
  // Security
  lastPasswordChange: timestamp('last_password_change'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  deadline: timestamp('deadline'),
  completed: boolean('completed').default(false).notNull(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const archivedTasks = pgTable('archived_tasks', {
  id: serial('id').primaryKey(),
  originalTaskId: integer('original_task_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  deadline: timestamp('deadline'),
  completed: boolean('completed').default(false).notNull(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deletedAt: timestamp('deleted_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  originalCreatedAt: timestamp('original_created_at'),
  originalUpdatedAt: timestamp('original_updated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});