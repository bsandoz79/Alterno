import type { ReminderSettings } from '../reminders/reminder-settings';

/** Port de persistance du réglage des rappels. */
export interface ReminderSettingsRepository {
  /**
   * @returns Le réglage enregistré, ou le réglage par défaut (15 min) si rien n'est enregistré
   */
  load(): Promise<ReminderSettings>;

  /**
   * Remplace le réglage enregistré.
   *
   * @param settings - Nouveau réglage
   */
  save(settings: ReminderSettings): Promise<void>;
}
