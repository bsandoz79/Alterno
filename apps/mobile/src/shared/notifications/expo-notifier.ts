import type { DepartureReminder, Notifier, ReminderDelivery } from '@alterno/engine';
import * as Notifications from 'expo-notifications';

import { departureReminderContent, departureReminderTime } from './departure-reminder-content';
import { WEEK_CHECK_ACTIONS, WEEK_CHECK_CATEGORY } from './week-check-category';

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
        // Plusieurs notifications par jour (avant, au départ, fin de semaine) : le type fait partie de l'identifiant.
        identifier: `${IDENTIFIER_PREFIX}${reminder.kind}-${reminder.date.toIsoString()}`,
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
   * Crée le canal et les boutons de la question de fin de semaine, puis vérifie (ou demande)
   * la permission. Sur Android 13, la demande n'apparaît qu'une fois un canal créé.
   */
  private async allowed(): Promise<boolean> {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rappels de départ',
      importance: Notifications.AndroidImportance.HIGH,
    });
    // Les deux boutons ouvrent l'app : sinon, app fermée, la réponse serait perdue
    // et la notification resterait affichée.
    await Notifications.setNotificationCategoryAsync(WEEK_CHECK_CATEGORY, [
      {
        identifier: WEEK_CHECK_ACTIONS.confirm,
        buttonTitle: 'Oui',
        options: { opensAppToForeground: true },
      },
      {
        identifier: WEEK_CHECK_ACTIONS.correct,
        buttonTitle: 'Corriger',
        options: { opensAppToForeground: true },
      },
    ]);
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      return true;
    }
    return current.canAskAgain && (await Notifications.requestPermissionsAsync()).granted;
  }
}
