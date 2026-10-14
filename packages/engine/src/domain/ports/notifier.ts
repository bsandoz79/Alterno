import type { DepartureReminder } from '../reminders/departure-reminder-planner';

/**
 * Ce qu'il est advenu des rappels confiés au notificateur :
 * - `scheduled` : programmés (ou tous annulés si la liste était vide) ;
 * - `not-allowed` : le téléphone refuse les notifications de l'app ;
 * - `unsupported` : pas de notifications ici (navigateur, Expo Go).
 */
export type ReminderDelivery = 'scheduled' | 'not-allowed' | 'unsupported';

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
   * @returns Si les rappels ont pu être programmés, pour le dire à l'utilisateur
   */
  replaceDepartureReminders(reminders: readonly DepartureReminder[]): Promise<ReminderDelivery>;
}
