import { pgTable, serial, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { userRoleEnum } from '../types/user.roles.types.js';
export { userRoleEnum };

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('member').notNull(),
  active: boolean('active').default(true).notNull(),
  refreshToken: varchar('refresh_token', { length: 255 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
