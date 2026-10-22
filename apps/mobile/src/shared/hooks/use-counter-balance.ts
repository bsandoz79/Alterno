import type { HoursCounter } from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useRepositories } from '@/shared/storage/repositories-context';

/**
 * Charge le compteur à chaque affichage de l'écran (il a pu être recalé ailleurs).
 *
 * @returns Le compteur, `null` pendant le chargement
 */
export function useCounterBalance(): HoursCounter | null {
  const { counter } = useRepositories();
  const [balance, setBalance] = useState<HoursCounter | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void counter.load().then((loaded) => {
        if (active) {
          setBalance(loaded);
        }
      });
      return () => {
        active = false;
      };
    }, [counter]),
  );

  return balance;
}
