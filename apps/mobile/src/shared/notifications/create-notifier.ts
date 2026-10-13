import type { Notifier } from '@alterno/engine';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { DeferredNotifier } from './deferred-notifier';
import { SilentNotifier } from './silent-notifier';

/**
 * Indique si les rappels peuvent s'afficher ici : sur Android, dans l'application installée
 * (APK ou build de développement). Expo Go refuse expo-notifications depuis le SDK 53
 * (le module lève une erreur dès son chargement) et le navigateur ne le prend pas en charge.
 *
 * @returns `true` si les notifications locales sont disponibles
 */
export function notificationsSupported(): boolean {
  return Platform.OS === 'android' && !isRunningInExpoGo();
}

/**
 * Crée le notificateur adapté à l'environnement.
 *
 * @returns Les notifications Expo (chargées à la demande) si elles sont disponibles, sinon un notificateur silencieux
 */
export function createNotifier(): Notifier {
  return notificationsSupported()
    ? new DeferredNotifier(async () => {
        // Import dynamique : expo-notifications n'est jamais chargé dans Expo Go.
        const { ExpoNotifier } = await import('./expo-notifier');
        return new ExpoNotifier();
      })
    : new SilentNotifier();
}
