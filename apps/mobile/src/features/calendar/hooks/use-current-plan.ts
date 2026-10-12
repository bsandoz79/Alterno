import type { DatedPlan } from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useRepositories } from '@/shared/storage/repositories-context';

/** Plan en cours : `undefined` pendant le chargement, `null` si aucun plan n'a été validé. */
export type CurrentPlanState = DatedPlan | null | undefined;

/**
 * Charge le plan en cours à chaque affichage de l'écran (il a pu être validé entre-temps dans Simulation).
 *
 * @returns Le plan en cours, `null` s'il n'y en a pas, `undefined` pendant le chargement
 */
export function useCurrentPlan(): CurrentPlanState {
  const { plans } = useRepositories();
  const [plan, setPlan] = useState<CurrentPlanState>(undefined);

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
