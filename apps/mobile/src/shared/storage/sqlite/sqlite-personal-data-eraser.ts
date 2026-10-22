import type { PersonalDataEraser } from '../personal-data-eraser';
import type { SqlDatabase } from './sql-database';

/**
 * Tables qui contiennent des données personnelles. Toute nouvelle table doit être ajoutée ici
 * (le test de contrat le vérifie : après effacement, chaque dépôt doit revenir à son état initial).
 */
const PERSONAL_TABLES = [
  'plan_day',
  'plan_recovery',
  'counter',
  'work_rules_settings',
  'planning_preferences',
  'school_week',
  'annual_calendar',
  'reminder_settings',
  'day_archive',
  'contract',
] as const;

/** Effacement des données dans la base SQLite (Android). Le schéma, lui, est gardé. */
export class SqlitePersonalDataEraser implements PersonalDataEraser {
  /**
   * @param db - Base SQLite migrée
   */
  constructor(private readonly db: SqlDatabase) {}

  /** @inheritdoc */
  async eraseAll(): Promise<void> {
    // Transaction : soit tout est effacé, soit rien (jamais de données à moitié supprimées).
    await this.db.withTransactionAsync(async () => {
      for (const table of PERSONAL_TABLES) {
        await this.db.runAsync(`DELETE FROM ${table}`);
      }
    });
  }
}
