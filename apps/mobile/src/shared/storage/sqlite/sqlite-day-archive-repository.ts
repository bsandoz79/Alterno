import type { ArchivedDay, DayArchiveRepository } from '@alterno/engine';

import {
  fromArchivedDayRecord,
  toArchivedDayRecord,
  type ArchivedDayRecord,
} from '../archived-day-record';
import type { SqlDatabase } from './sql-database';

/** Ligne de la table `day_archive` (colonnes en snake_case). */
interface ArchiveRow {
  readonly date: string;
  readonly kind: ArchivedDayRecord['kind'];
  readonly worked_minutes: number;
  readonly expected_minutes: number;
  readonly arrival: number | null;
  readonly lunch_start: number | null;
  readonly lunch_end: number | null;
  readonly departure: number | null;
}

/** Journées archivées dans la table `day_archive`, une ligne par date. */
export class SqliteDayArchiveRepository implements DayArchiveRepository {
  /**
   * @param db - Base SQLite migrée
   */
  constructor(private readonly db: SqlDatabase) {}

  /** @inheritdoc */
  async loadAll(): Promise<readonly ArchivedDay[]> {
    const rows = await this.db.getAllAsync<ArchiveRow>('SELECT * FROM day_archive ORDER BY date');
    return rows.map((row) =>
      fromArchivedDayRecord({
        date: row.date,
        kind: row.kind,
        worked: row.worked_minutes,
        expected: row.expected_minutes,
        arrival: row.arrival,
        lunchStart: row.lunch_start,
        lunchEnd: row.lunch_end,
        departure: row.departure,
      }),
    );
  }

  /** @inheritdoc */
  async save(days: readonly ArchivedDay[]): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      for (const record of days.map(toArchivedDayRecord)) {
        // La date est la clé : une journée déjà archivée est remplacée (écart déclaré après coup).
        await this.db.runAsync(
          `INSERT OR REPLACE INTO day_archive
             (date, kind, worked_minutes, expected_minutes, arrival, lunch_start, lunch_end, departure)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.date,
            record.kind,
            record.worked,
            record.expected,
            record.arrival,
            record.lunchStart,
            record.lunchEnd,
            record.departure,
          ],
        );
      }
    });
  }
}
