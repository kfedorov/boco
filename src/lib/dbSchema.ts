import { text, sqliteTable, integer } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('user', {
	id: text('id').primaryKey().notNull(),
	username: text('username').notNull(),
	email: text('email').unique().notNull(),
	hashedPassword: text('hashed_password').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').notNull().primaryKey(),
	expiresAt: integer('expires_at').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
});
