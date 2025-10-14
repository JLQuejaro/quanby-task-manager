"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasks = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.varchar)('password', { length: 255 }),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    authProvider: (0, pg_core_1.varchar)('auth_provider', { length: 20 }).default('email'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.tasks = (0, pg_core_1.pgTable)('tasks', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    priority: (0, pg_core_1.varchar)('priority', { length: 20 }).notNull().default('medium'),
    deadline: (0, pg_core_1.timestamp)('deadline'),
    completed: (0, pg_core_1.boolean)('completed').default(false).notNull(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
//# sourceMappingURL=schema.js.map