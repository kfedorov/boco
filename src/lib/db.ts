import { drizzle } from 'drizzle-orm/better-sqlite3';
import sqlite from 'better-sqlite3';
import * as schema from './dbSchema';

export const sqliteDB = sqlite('dev.db');
export const db = drizzle(sqliteDB, { schema });
