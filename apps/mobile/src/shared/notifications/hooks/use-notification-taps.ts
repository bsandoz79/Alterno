import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { listenToNotificationTaps } from '../notification-taps';

/**
 * Ouvre l'écran désigné par une notification touchée (par exemple « Parti plus tard »
 * depuis la question de l'heure de départ). À placer une seule fois, dans la navigation principale.
 */
export function useNotificationTaps(): void {
  const router = useRouter();
  useEffect(() => {
    let stop: (() => void) | null = null;
    let active = true;
    // L'écoute démarre après le premier affichage : la navigation est alors prête à ouvrir un écran.
    void listenToNotificationTaps((url) => {
      router.push(url);
    }).then((unsubscribe) => {
      if (active) {
        stop = unsubscribe;
      } else {
        unsubscribe();
      }
    });
    return () => {
      active = false;
      stop?.();
    };
  }, [router]);
}
