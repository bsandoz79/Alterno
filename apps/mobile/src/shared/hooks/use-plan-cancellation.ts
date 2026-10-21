import {
  CancelPlan,
  CancelRecovery,
  buildWorkRules,
  laBrosseEtDupontSettings,
  type CalendarDate,
  type DatedPlan,
} from '@alterno/engine';
import { useCallback } from 'react';

import { systemClock } from '@/shared/clock/system-clock';
import { useRepositories } from '@/shared/storage/repositories-context';

/** Actions d'annulation (cas d'usage `CancelPlan` et `CancelRecovery`). */
export interface PlanCancellation {
  /** Annule le plan à partir de `from` (aujourd'hui par défaut) et l'enregistre. */
  readonly cancelPlan: (plan: DatedPlan, from?: CalendarDate) => Promise<DatedPlan>;
  /** Annule la récup du plan en cours ; `null` s'il n'y en a pas. */
  readonly cancelRecovery: () => Promise<DatedPlan | null>;
}

/**
 * Relie les écrans aux cas d'usage d'annulation. Règles, préférences et semaines d'école
 * sont relues au moment d'annuler : elles ont pu changer depuis l'ouverture de l'écran.
 *
 * @returns Les deux actions d'annulation
 */
export function usePlanCancellation(): PlanCancellation {
  const { plans, workRules, preferences, schoolWeeks } = useRepositories();

  const load = useCallback(async () => {
    const [settings, savedPreferences, weeks] = await Promise.all([
      workRules.load(),
      preferences.load(),
      schoolWeeks.load(),
    ]);
    return {
      rules: buildWorkRules(settings ?? laBrosseEtDupontSettings()),
      preferences: savedPreferences,
      schoolWeeks: weeks,
    };
  }, [workRules, preferences, schoolWeeks]);

  const cancelPlan = useCallback(
    async (plan: DatedPlan, from?: CalendarDate) => {
      const context = await load();
      return new CancelPlan(plans, context.rules, context.preferences, systemClock).execute(
        plan,
        context.schoolWeeks,
        from,
      );
    },
    [load, plans],
  );

  const cancelRecovery = useCallback(async () => {
    const context = await load();
    return new CancelRecovery(plans, context.rules, context.preferences, systemClock).execute();
  }, [load, plans]);

  return { cancelPlan, cancelRecovery };
}
