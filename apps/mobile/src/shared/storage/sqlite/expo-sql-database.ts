import type { SQLiteDatabase } from 'expo-sqlite';

import type { SqlDatabase, SqlValue } from './sql-database';

/**
 * Adapte une base expo-sqlite à l'interface `SqlDatabase` utilisée par les dépôts.
 *
 * @param db - Base ouverte par expo-sqlite
 * @returns La même base, vue à travers `SqlDatabase`
 */
export function fromExpoDatabase(db: SQLiteDatabase): SqlDatabase {
  return {
    execAsync: (sql) => db.execAsync(sql),
    runAsync: async (sql, params: readonly SqlValue[] = []) => {
      await db.runAsync(sql, [...params]);
    },
    getFirstAsync: <T>(sql: string, params: readonly SqlValue[] = []) =>
      db.getFirstAsync<T>(sql, [...params]),
    getAllAsync: <T>(sql: string, params: readonly SqlValue[] = []) =>
      db.getAllAsync<T>(sql, [...params]),
    withTransactionAsync: (task) => db.withTransactionAsync(task),
  };
}
