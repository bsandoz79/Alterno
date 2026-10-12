import type { Plan, PlanRepository } from '@alterno/engine';

import { fromDayRecords, toDayRecord, type DayRecord } from '../day-record';
import type { SqlDatabase } from './sql-database';

/** Ligne de la table `plan_day`. */
interface PlanDayRow {
  readonly weekday: string;
  readonly arrival_minutes: number;
  readonly lunch_start_minutes: number;
  readonly lunch_end_minutes: number;
  readonly departure_minutes: number;
  readonly worked_minutes: number;
}

/** Plan en cours stocké dans la table `plan_day`, une ligne par journée. */
export class SqlitePlanRepository implements PlanRepository {
  /**
   * @param db - Base SQLite migrée
   */
  constructor(private readonly db: SqlDatabase) {}

  /** @inheritdoc */
  async loadCurrent(): Promise<Plan | null> {
    const rows = await this.db.getAllAsync<PlanDayRow>(
      `SELECT weekday, arrival_minutes, lunch_start_minutes, lunch_end_minutes,
              departure_minutes, worked_minutes
       FROM plan_day ORDER BY position`,
    );
    return rows.length === 0 ? null : fromDayRecords(rows.map(toRecord));
  }

  /** @inheritdoc */
  async saveCurrent(plan: Plan): Promise<void> {
    // Transaction : on ne doit jamais se retrouver avec un plan à moitié remplacé.
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('DELETE FROM plan_day');
      for (const [position, day] of plan.days.entries()) {
        const record = toDayRecord(day);
        await this.db.runAsync(
          `INSERT INTO plan_day (position, weekday, arrival_minutes, lunch_start_minutes,
                                 lunch_end_minutes, departure_minutes, worked_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            position,
            record.weekday,
            record.arrival,
            record.lunchStart,
            record.lunchEnd,
            record.departure,
            record.worked,
          ],
        );
      }
    });
  }
}

/** Ligne SQL → données brutes communes. */
function toRecord(row: PlanDayRow): DayRecord {
  return {
    weekday: row.weekday,
    arrival: row.arrival_minutes,
    lunchStart: row.lunch_start_minutes,
    lunchEnd: row.lunch_end_minutes,
    departure: row.departure_minutes,
    worked: row.worked_minutes,
  };
}
