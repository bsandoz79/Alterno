import {
  RecoveryDayTimetable,
  type DatedPlan,
  type RecoveryDay,
  type WorkRules,
} from '@alterno/engine';

/**
 * Horaires du jour de récup du plan (travail et repos d'une demi-journée, ou journée entière),
 * calculés par le moteur à partir des règles horaires.
 *
 * @param plan - Plan en cours
 * @param rules - Règles horaires de l'utilisateur
 * @returns Les horaires du jour de récup, ou `null` sans récup (ou récup un jour non travaillé)
 */
export function recoveryDayOf(plan: DatedPlan, rules: WorkRules): RecoveryDay | null {
  const { recovery } = plan;
  // Un jour non travaillé n'a pas d'horaires : la récup s'y affiche sans détail.
  if (recovery === undefined || !rules.isWorkingDay(recovery.date.weekday())) {
    return null;
  }
  return new RecoveryDayTimetable(rules).dayOf(recovery);
}
