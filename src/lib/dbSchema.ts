import { text, sqliteTable, integer } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('user', {
	id: text('id').primaryKey().notNull(),
	username: text('username').notNull(),
	email: text('email').unique().notNull(),
	hashedPassword: text('hashed_password').notNull(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false)
});

export const sessions = sqliteTable('session', {
	id: text('id').notNull().primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
});

export const emailVerificationCodes = sqliteTable('email_verification_code', {
	id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
	code: text('code').notNull(),
	userId: text('user_id')
		.unique()
		.references(() => users.id)
		.notNull(),
	email: text('email').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});
