import { Duration, HoursCounter, type CounterRepository } from '@alterno/engine';

import type { SqlDatabase } from './sql-database';

/** Compteur d'heures stocké dans la table `counter` (une seule ligne, id = 1). */
export class SqliteCounterRepository implements CounterRepository {
  /**
   * @param db - Base SQLite migrée
   */
  constructor(private readonly db: SqlDatabase) {}

  /** @inheritdoc */
  async load(): Promise<HoursCounter> {
    const row = await this.db.getFirstAsync<{ balance_minutes: number }>(
      'SELECT balance_minutes FROM counter WHERE id = 1',
    );
    return row === null
      ? HoursCounter.zero()
      : HoursCounter.of(Duration.ofMinutes(row.balance_minutes));
  }

  /** @inheritdoc */
  async save(counter: HoursCounter): Promise<void> {
    // « Upsert » : crée la ligne la première fois, la met à jour ensuite.
    await this.db.runAsync(
      `INSERT INTO counter (id, balance_minutes) VALUES (1, ?)
       ON CONFLICT (id) DO UPDATE SET balance_minutes = excluded.balance_minutes`,
      [counter.balance.toMinutes()],
    );
  }
}
