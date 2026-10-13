import type { DepartureReminder } from '../reminders/departure-reminder-planner';

/**
 * Port des notifications locales. Le domaine décide quoi rappeler et quand ;
 * l'app fournit l'implémentation (notifications Android, rien sur le web).
 */
export interface Notifier {
  /**
   * Remplace tous les rappels de départ déjà programmés par ceux-ci
   * (une liste vide les annule tous).
   *
   * @param reminders - Rappels à programmer
   */
  replaceDepartureReminders(reminders: readonly DepartureReminder[]): Promise<void>;
}
