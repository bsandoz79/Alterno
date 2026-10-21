import {
  buildWorkRules,
  laBrosseEtDupontSettings,
  type DatedPlan,
  type RecoveryDay,
} from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { recoveryDayOf } from '@/shared/planning/recovery-day-of';
import { useRepositories } from '@/shared/storage/repositories-context';

/**
 * Horaires du jour de récup du plan, recalculés à chaque affichage de l'écran
 * (les règles horaires ont pu changer dans les réglages).
 *
 * @param plan - Plan en cours, ou `null`/`undefined` pendant le chargement ou sans plan
 * @returns Les horaires du jour de récup, ou `null` (pas de récup, ou chargement en cours)
 */
export function useRecoveryDay(plan: DatedPlan | null | undefined): RecoveryDay | null {
  const { workRules } = useRepositories();
  const [recoveryDay, setRecoveryDay] = useState<RecoveryDay | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (plan === null || plan === undefined) {
        setRecoveryDay(null);
        return undefined;
      }
      void workRules.load().then((settings) => {
        if (active) {
          setRecoveryDay(
            recoveryDayOf(plan, buildWorkRules(settings ?? laBrosseEtDupontSettings())),
          );
        }
      });
      return () => {
        active = false;
      };
    }, [plan, workRules]),
  );

  return recoveryDay;
}
