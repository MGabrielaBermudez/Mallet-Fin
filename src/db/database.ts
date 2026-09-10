import * as SQLite from 'expo-sqlite';
import { SCHEMA } from './schema';
import { seedIfFirstRun } from '../seed';

const DB_NAME = 'finance-calendar.db';

export let db: SQLite.SQLiteDatabase;

/** Abre la base y aplica el esquema (y el seed solo la primera vez). */
export async function openDatabase(): Promise<void> {
  if (db) return;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(SCHEMA);
  await seedIfFirstRun(db);
}