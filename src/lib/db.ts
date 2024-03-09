import { type BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import sqlite from 'better-sqlite3';
import * as schema from './dbSchema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

let sqliteDB: sqlite.Database;
let db: BetterSQLite3Database<typeof schema>;

if (import.meta.env.MODE === 'test') {
    sqliteDB = new sqlite();
    db = drizzle(sqliteDB, { schema });
    migrate(db, { migrationsFolder: './drizzle' });
} else {
    sqliteDB = sqlite('dev.db');
    db = drizzle(sqliteDB, { schema });
}

export { sqliteDB, db };
