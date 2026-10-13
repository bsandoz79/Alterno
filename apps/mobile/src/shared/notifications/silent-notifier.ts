import type { Notifier } from '@alterno/engine';

/**
 * Notificateur qui ne programme rien : utilisé là où expo-notifications n'est pas utilisable
 * (navigateur, et Expo Go sur Android, où le simple import du module plante depuis le SDK 53).
 */
export class SilentNotifier implements Notifier {
  /** Ignore les rappels : il n'y a rien à programmer ici. */
  replaceDepartureReminders(): Promise<void> {
    return Promise.resolve();
  }
}
