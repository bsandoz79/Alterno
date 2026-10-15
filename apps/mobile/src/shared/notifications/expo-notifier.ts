import type { DepartureReminder, Notifier, ReminderDelivery } from '@alterno/engine';
import * as Notifications from 'expo-notifications';

import { departureReminderContent, departureReminderTime } from './departure-reminder-content';

/** Canal Android des rappels : l'utilisateur peut le régler ou le couper dans les paramètres du téléphone. */
const CHANNEL_ID = 'departure-reminders';
/** Préfixe des identifiants : seuls nos rappels de départ sont remplacés, pas d'autres notifications. */
const IDENTIFIER_PREFIX = 'departure-';

/**
 * Notifications locales Android avec expo-notifications (disponibles aussi dans Expo Go).
 * La permission est demandée à la première programmation ; si elle est refusée, rien n'est programmé.
 */
export class ExpoNotifier implements Notifier {
  constructor() {
    // Sans gestionnaire, une notification reçue app ouverte n'est pas affichée.
    Notifications.setNotificationHandler({
      handleNotification: () =>
        Promise.resolve({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
    });
  }

  /** @inheritdoc */
  async replaceDepartureReminders(
    reminders: readonly DepartureReminder[],
  ): Promise<ReminderDelivery> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((request) => request.identifier.startsWith(IDENTIFIER_PREFIX))
        .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
    );
    if (reminders.length === 0) {
      return 'scheduled';
    }
    if (!(await this.allowed())) {
      return 'not-allowed';
    }
    for (const reminder of reminders) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${IDENTIFIER_PREFIX}${reminder.date.toIsoString()}`,
        content: departureReminderContent(reminder),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: departureReminderTime(reminder),
          channelId: CHANNEL_ID,
        },
      });
    }
    return 'scheduled';
  }

  /**
   * Crée le canal puis vérifie (ou demande) la permission.
   * Sur Android 13, la demande n'apparaît qu'une fois un canal créé.
   */
  private async allowed(): Promise<boolean> {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rappels de départ',
      importance: Notifications.AndroidImportance.HIGH,
    });
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      return true;
    }
    return current.canAskAgain && (await Notifications.requestPermissionsAsync()).granted;
  }
}
