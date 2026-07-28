import { pgTable, serial, integer, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../users/schemas/user.schema.js';

export const passwordResetTokens = pgTable('password_reset_tokens', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
});
