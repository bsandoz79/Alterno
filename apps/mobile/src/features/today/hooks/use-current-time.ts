import type { Clock, TimeOfDay } from '@alterno/engine';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const MILLISECONDS_PER_MINUTE = 60_000;

/**
 * Heure actuelle, mise à jour au changement de chaque minute et au retour dans l'app
 * (les minuteurs sont suspendus quand l'app est en arrière-plan).
 *
 * @param clock - Horloge (port `Clock`), remplaçable dans les tests
 * @returns L'heure actuelle
 */
export function useCurrentTime(clock: Clock): TimeOfDay {
  const [now, setNow] = useState(() => clock.currentTime());

  useEffect(() => {
    const refresh = (): void => {
      setNow(clock.currentTime());
    };
    let interval: ReturnType<typeof setInterval> | null = null;
    // Premier rafraîchissement calé sur la minute suivante, puis toutes les minutes.
    const untilNextMinute = MILLISECONDS_PER_MINUTE - (Date.now() % MILLISECONDS_PER_MINUTE);
    const timeout = setTimeout(() => {
      refresh();
      interval = setInterval(refresh, MILLISECONDS_PER_MINUTE);
    }, untilNextMinute);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => {
      clearTimeout(timeout);
      if (interval !== null) {
        clearInterval(interval);
      }
      subscription.remove();
    };
  }, [clock]);

  return now;
}
