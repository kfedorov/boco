import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db } from './db';
// This will run migrations on the database, skipping the ones already applied
migrate(db, { migrationsFolder: './drizzle' });
