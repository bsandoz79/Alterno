import { DatabaseSync } from 'node:sqlite';

import type { SqlDatabase, SqlValue } from '../sqlite/sql-database';

/**
 * Base SQLite en mémoire fournie par Node, exposée avec la même interface qu'expo-sqlite.
 * Permet de tester les vraies requêtes SQL des adaptateurs sans téléphone ni émulateur.
 *
 * @returns Une base vide, détruite à la fin du test
 */
export function createNodeSqlDatabase(): SqlDatabase {
  const db = new DatabaseSync(':memory:');
  const statement = (sql: string) => db.prepare(sql);

  return {
    execAsync: (sql) => {
      db.exec(sql);
      return Promise.resolve();
    },
    runAsync: (sql, params: readonly SqlValue[] = []) => {
      statement(sql).run(...params);
      return Promise.resolve();
    },
    getFirstAsync: <T>(sql: string, params: readonly SqlValue[] = []) =>
      Promise.resolve((statement(sql).get(...params) as T | undefined) ?? null),
    getAllAsync: <T>(sql: string, params: readonly SqlValue[] = []) =>
      Promise.resolve(statement(sql).all(...params) as T[]),
    withTransactionAsync: async (task) => {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
