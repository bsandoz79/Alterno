import type { Notifier, ReminderDelivery } from '@alterno/engine';

/**
 * Notificateur qui ne programme rien : utilisé là où expo-notifications n'est pas utilisable
 * (navigateur, et Expo Go sur Android, où le simple import du module plante depuis le SDK 53).
 */
export class SilentNotifier implements Notifier {
  /** Ignore les rappels et signale qu'ils ne peuvent pas s'afficher ici. */
  replaceReminders(): Promise<ReminderDelivery> {
    return Promise.resolve('unsupported');
  }
}
