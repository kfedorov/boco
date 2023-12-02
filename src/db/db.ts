import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

export const sqliteDatabase = new Database('sqlite.db');
export const db = drizzle(sqliteDatabase);
