import { notificationsSupported } from './create-notifier';
import { notificationUrl } from './notification-url';

/**
 * Écoute les notifications touchées et ouvre l'écran qu'elles désignent,
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
  const openFrom = (data: unknown): void => {
    const url = notificationUrl(data);
    if (url !== null) {
      open(url);
    }
  };
  // Notification qui a lancé l'app : traitée une fois, puis oubliée pour ne pas rouvrir l'écran.
  const launching = Notifications.getLastNotificationResponse();
  if (launching !== null) {
    openFrom(launching.notification.request.content.data);
    Notifications.clearLastNotificationResponse();
  }
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    openFrom(response.notification.request.content.data);
  });
  return () => {
    subscription.remove();
  };
}
