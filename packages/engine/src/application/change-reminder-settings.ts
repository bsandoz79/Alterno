import type { ReminderSettingsRepository } from '../domain/ports/reminder-settings-repository';
import type { ReminderSettings } from '../domain/reminders/reminder-settings';
import type {
  ReminderScheduling,
  ScheduleDepartureReminders,
} from './schedule-departure-reminders';

/**
 * Cas d'usage « Valider le réglage du rappel » : enregistre le nouveau délai,
 * puis reprogramme aussitôt les rappels, pour confirmer à l'utilisateur ce qui a été programmé.
 */
export class ChangeReminderSettings {
  /**
   * @param settings - Dépôt du réglage des rappels
   * @param scheduler - Reprogrammation des rappels de départ
   */
  constructor(
    private readonly settings: ReminderSettingsRepository,
    private readonly scheduler: ScheduleDepartureReminders,
  ) {}

  /**
   * @param settings - Nouveau réglage
   * @returns Le nombre de rappels programmés et si le téléphone les accepte
   */
  async execute(settings: ReminderSettings): Promise<ReminderScheduling> {
    await this.settings.save(settings);
    return this.scheduler.execute();
  }
}
