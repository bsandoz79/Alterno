import { CalendarDate, SchoolWeeks, type SchoolWeeksRepository } from '@alterno/engine';

import type { SqlDatabase } from './sql-database';

/** Semaines d'école stockées dans la table `school_week`, une ligne par lundi. */
export class SqliteSchoolWeeksRepository implements SchoolWeeksRepository {
  /**
   * @param db - Base SQLite migrée
   */
  constructor(private readonly db: SqlDatabase) {}

  /** @inheritdoc */
  async load(): Promise<SchoolWeeks> {
    const rows = await this.db.getAllAsync<{ monday: string }>('SELECT monday FROM school_week');
    return SchoolWeeks.of(rows.map((row) => CalendarDate.fromIsoString(row.monday)));
  }

  /** @inheritdoc */
  async save(weeks: SchoolWeeks): Promise<void> {
    // Transaction : la liste est remplacée d'un bloc, jamais à moitié.
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('DELETE FROM school_week');
      for (const monday of weeks.mondays()) {
        await this.db.runAsync('INSERT INTO school_week (monday) VALUES (?)', [
          monday.toIsoString(),
        ]);
      }
    });
  }
}
