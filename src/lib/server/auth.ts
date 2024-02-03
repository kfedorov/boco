import { Lucia } from 'lucia';
import { dev } from '$app/environment';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import { sqlite } from '$lib/db';

const adapter = new BetterSqlite3Adapter(sqlite, {
	user: 'user',
	session: 'session'
});

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: !dev
		}
	},
	getUserAttributes(databaseUser) {
		return {
			username: databaseUser.user_name,
			email: databaseUser.email
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
	}
}
