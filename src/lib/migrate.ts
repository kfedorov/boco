import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './db';

export default function runMigrations() {
	console.group('Starting migrations');
	// This will run migrations on the database, skipping the ones already applied
	migrate(db, { migrationsFolder: './drizzle' });

	console.log('Migrations completed');
	console.groupEnd();
}
