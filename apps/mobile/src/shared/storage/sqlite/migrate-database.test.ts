import { describe, expect, it } from 'vitest';

import { createNodeSqlDatabase } from '../testing/node-sql-database';
import { migrateDatabase } from './migrate-database';

const tablesOf = async (db: ReturnType<typeof createNodeSqlDatabase>): Promise<string[]> =>
  (
    await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    )
  ).map((row) => row.name);

describe('migrateDatabase — schéma de la base locale', () => {
  it('crée les tables du compteur et du plan sur une base neuve', async () => {
    const db = createNodeSqlDatabase();
    await migrateDatabase(db);

    expect(await tablesOf(db)).toEqual(['counter', 'plan_day']);
  });

  it('enregistre la version du schéma pour ne pas rejouer les migrations', async () => {
    const db = createNodeSqlDatabase();
    await migrateDatabase(db);
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');

    expect(version?.user_version).toBe(1);
  });

  it('ne touche pas aux données d’une base déjà à jour', async () => {
    const db = createNodeSqlDatabase();
    await migrateDatabase(db);
    await db.runAsync('INSERT INTO counter (id, balance_minutes) VALUES (1, ?)', [42]);
    await migrateDatabase(db);
    const row = await db.getFirstAsync<{ balance_minutes: number }>(
      'SELECT balance_minutes FROM counter',
    );

    expect(row?.balance_minutes).toBe(42);
  });
});
