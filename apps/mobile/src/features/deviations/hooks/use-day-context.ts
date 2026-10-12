import {
  buildWorkRules,
  laBrosseEtDupontSettings,
  type DatedPlan,
  type PlanningPreferences,
  type WorkRules,
} from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useRepositories } from '@/shared/storage/repositories-context';

/** Données nécessaires pour modifier un jour : plan en cours, règles et préférences. */
export interface DayContext {
  /** `null` si aucun plan n'a été validé. */
  readonly plan: DatedPlan | null;
  readonly rules: WorkRules;
  readonly preferences: PlanningPreferences;
}

/** État du chargement, et action pour recharger après un enregistrement. */
export interface DayContextState {
  /** `null` pendant le chargement. */
  readonly context: DayContext | null;
  readonly reload: () => void;
}

/**
 * Charge le plan, les règles (réglages ou preset) et les préférences à chaque affichage de l'écran :
 * ils ont pu changer dans un autre onglet entre-temps.
 *
 * @returns Les données chargées et l'action de rechargement
 */
export function useDayContext(): DayContextState {
  const { plans, workRules, preferences } = useRepositories();
  const [context, setContext] = useState<DayContext | null>(null);
  const [version, setVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([plans.loadCurrent(), workRules.load(), preferences.load()]).then(
        ([plan, settings, savedPreferences]) => {
          if (active) {
            setContext({
              plan,
              rules: buildWorkRules(settings ?? laBrosseEtDupontSettings()),
              preferences: savedPreferences,
            });
          }
        },
      );
      return () => {
        active = false;
      };
      // `version` relance le chargement après un enregistrement, sans quitter l'écran.
    }, [plans, workRules, preferences, version]),
  );

  return {
    context,
    reload: () => {
      setVersion((current) => current + 1);
    },
  };
}
