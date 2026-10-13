import type { Clock } from '../domain/ports/clock';
import type { Notifier } from '../domain/ports/notifier';
import type { PlanRepository } from '../domain/ports/plan-repository';
import type { ReminderSettingsRepository } from '../domain/ports/reminder-settings-repository';
import { DepartureReminderPlanner } from '../domain/reminders/departure-reminder-planner';

/**
 * Cas d'usage « Reprogrammer les rappels de départ » : à chaque changement du plan ou du réglage
 * (et à l'ouverture de l'app), les rappels programmés sont remplacés par ceux du plan en cours.
 * Tout remplacer plutôt que modifier au cas par cas évite les rappels oubliés d'un ancien plan.
 */
export class ScheduleDepartureReminders {
  private readonly planner = new DepartureReminderPlanner();

  /**
   * @param plans - Dépôt du plan en cours
   * @param settings - Dépôt du réglage des rappels
   * @param notifier - Notifications locales
   * @param clock - Horloge (date et heure actuelles)
   */
  constructor(
    private readonly plans: PlanRepository,
    private readonly settings: ReminderSettingsRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
  ) {}

  /**
   * @returns Le nombre de rappels programmés
   */
  async execute(): Promise<number> {
    const [plan, settings] = await Promise.all([this.plans.loadCurrent(), this.settings.load()]);
    const reminders =
      plan === null
        ? []
        : this.planner.remindersFor(
            plan,
            { today: this.clock.today(), now: this.clock.currentTime() },
            settings,
          );
    await this.notifier.replaceDepartureReminders(reminders);
    return reminders.length;
  }
}
