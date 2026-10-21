import type { NotificationResponse } from 'expo-notifications';

import { notificationsSupported } from './create-notifier';
import { notificationTarget } from './notification-target';

/**
 * Écoute les notifications touchées (ou l'un de leurs boutons) et ouvre l'écran qu'elles désignent,
 * y compris celle qui a lancé l'app. Rien n'est chargé là où expo-notifications n'est pas utilisable.
 *
 * @param open - Ouverture d'un écran de l'app (adresse « /… »)
 * @returns De quoi arrêter l'écoute
 */
export async function listenToNotificationTaps(open: (url: string) => void): Promise<() => void> {
  if (!notificationsSupported()) {
    return () => undefined;
  }
  // Import dynamique, comme pour le notificateur : jamais chargé dans Expo Go.
  const Notifications = await import('expo-notifications');
  const respond = (response: NotificationResponse): void => {
    const { identifier, content } = response.notification.request;
    // Sur Android, toucher un bouton ne retire pas la notification (contrairement à la toucher) :
    // on la retire, pour qu'une question à laquelle on a répondu ne reste pas affichée.
    void Notifications.dismissNotificationAsync(identifier);
    const url = notificationTarget(response.actionIdentifier, content.data);
    if (url !== null) {
      open(url);
    }
  };
  // Notification qui a lancé l'app : traitée une fois, puis oubliée pour ne pas rouvrir l'écran.
  const launching = Notifications.getLastNotificationResponse();
  if (launching !== null) {
    respond(launching);
    Notifications.clearLastNotificationResponse();
  }
  const subscription = Notifications.addNotificationResponseReceivedListener(respond);
  return () => {
    subscription.remove();
  };
}
