import type { DatedPlan, PlanRepository } from '@alterno/engine';

import { fromDayRecords, toDayRecord, type DayRecord } from '../day-record';
import {
  toPlanRecoveryRecord,
  withPlanRecovery,
  type PlanRecoveryRecord,
} from '../plan-recovery-record';
import type { SqlDatabase } from './sql-database';

/** Ligne de la table `plan_day`. */
interface PlanDayRow {
  readonly date: string;
  readonly arrival_minutes: number;
  readonly lunch_start_minutes: number;
  readonly lunch_end_minutes: number;
  readonly departure_minutes: number;
  readonly worked_minutes: number;
}

/**
 * Plan en cours stocké dans la table `plan_day`, une ligne par journée datée,
 * et sa récup éventuelle dans la table `plan_recovery`.
 */
export class SqlitePlanRepository implements PlanRepository {
  /**
   * @param db - Base SQLite migrée
   */
  constructor(private readonly db: SqlDatabase) {}

  /** @inheritdoc */
  async loadCurrent(): Promise<DatedPlan | null> {
    const rows = await this.db.getAllAsync<PlanDayRow>(
      `SELECT date, arrival_minutes, lunch_start_minutes, lunch_end_minutes,
              departure_minutes, worked_minutes
       FROM plan_day ORDER BY position`,
    );
    if (rows.length === 0) {
      return null;
    }
    const recovery = await this.db.getFirstAsync<PlanRecoveryRecord>(
      'SELECT date, kind, part FROM plan_recovery WHERE id = 1',
    );
    return withPlanRecovery(fromDayRecords(rows.map(toRecord)), recovery);
  }

  /** @inheritdoc */
  async saveCurrent(plan: DatedPlan): Promise<void> {
    // Transaction : on ne doit jamais se retrouver avec un plan à moitié remplacé.
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('DELETE FROM plan_day');
      // Un plan sans récup (objectif d'heures) efface celle du plan précédent.
      await this.db.runAsync('DELETE FROM plan_recovery');
      if (plan.recovery !== undefined) {
        const recovery = toPlanRecoveryRecord(plan.recovery);
        await this.db.runAsync(
          'INSERT INTO plan_recovery (id, date, kind, part) VALUES (1, ?, ?, ?)',
          [recovery.date, recovery.kind, recovery.part ?? null],
        );
      }
      for (const [position, day] of plan.days.entries()) {
        const record = toDayRecord(day);
        await this.db.runAsync(
          `INSERT INTO plan_day (position, date, arrival_minutes, lunch_start_minutes,
                                 lunch_end_minutes, departure_minutes, worked_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            position,
            record.date,
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
    date: row.date,
    arrival: row.arrival_minutes,
    lunchStart: row.lunch_start_minutes,
    lunchEnd: row.lunch_end_minutes,
    departure: row.departure_minutes,
    worked: row.worked_minutes,
  };
}
