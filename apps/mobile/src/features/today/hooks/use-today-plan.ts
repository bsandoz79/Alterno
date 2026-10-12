import type { DatedPlan } from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useRepositories } from '@/shared/storage/repositories-context';

/**
 * Charge le plan en cours à chaque affichage de l'accueil : il a pu être validé ou recalculé ailleurs.
 *
 * @returns Le plan, `null` s'il n'y en a pas, `undefined` pendant le chargement
 */
export function useTodayPlan(): DatedPlan | null | undefined {
  const { plans } = useRepositories();
  const [plan, setPlan] = useState<DatedPlan | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void plans.loadCurrent().then((current) => {
        if (active) {
          setPlan(current);
        }
      });
      return () => {
        active = false;
      };
    }, [plans]),
  );

  return plan;
}
