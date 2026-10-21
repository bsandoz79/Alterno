import type { Clock } from '../domain/ports/clock';
import type { Notifier, ReminderDelivery } from '../domain/ports/notifier';
import type { PlanRepository } from '../domain/ports/plan-repository';
import type { ReminderSettingsRepository } from '../domain/ports/reminder-settings-repository';
import { DepartureReminderPlanner } from '../domain/reminders/departure-reminder-planner';
import { WeekCheckPlanner } from '../domain/reminders/week-check-planner';

/** Résultat d'une reprogrammation : combien de rappels, et s'ils ont pu être programmés. */
export interface ReminderScheduling {
  readonly count: number;
  readonly delivery: ReminderDelivery;
}

/**
 * Cas d'usage « Reprogrammer les rappels de départ » : à chaque changement du plan ou du réglage
 * (et à l'ouverture de l'app), les rappels programmés sont remplacés par ceux du plan en cours,
 * question de fin de semaine comprise.
 * Tout remplacer plutôt que modifier au cas par cas évite les rappels oubliés d'un ancien plan.
 */
export class ScheduleDepartureReminders {
  private readonly planner = new DepartureReminderPlanner();
  private readonly weekChecks = new WeekCheckPlanner();

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
   * @returns Le nombre de rappels à venir et ce qu'en a fait le téléphone
   */
  async execute(): Promise<ReminderScheduling> {
    const [plan, settings] = await Promise.all([this.plans.loadCurrent(), this.settings.load()]);
    const moment = { today: this.clock.today(), now: this.clock.currentTime() };
    const reminders =
      plan === null
        ? []
        : [
            ...this.planner.remindersFor(plan, moment, settings),
            ...this.weekChecks.checksFor(plan, moment, settings),
          ];
    const delivery = await this.notifier.replaceDepartureReminders(reminders);
    return { count: reminders.length, delivery };
  }
}
