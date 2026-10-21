import type {
  CalendarDate,
  DatedDay,
  DatedPlan,
  PlannedRecovery,
  SchoolWeeks,
} from '@alterno/engine';

const DAYS_PER_WEEK = 7;

/**
 * Ce qu'affiche l'accueil :
 * - `no-plan` : aucun plan validé, on invite à simuler ;
 * - `work` : aujourd'hui est planifié (départ en grand, bouton « Signaler un changement ») ;
 * - `recovery` : jour de repos compensatoire posé par le plan (journée ou demi-journée) ;
 * - `school` : journée d'école ;
 * - `before-plan` : le plan validé commence plus tard (aujourd'hui n'a pas été simulé) ;
 * - `off` : pas de plan aujourd'hui (week-end, plan terminé), avec le prochain jour planifié.
 */
export type TodayStatus =
  | { readonly kind: 'no-plan' }
  | { readonly kind: 'work'; readonly day: DatedDay }
  | { readonly kind: 'recovery'; readonly recovery: PlannedRecovery }
  | { readonly kind: 'school' }
  | { readonly kind: 'before-plan'; readonly first: DatedDay }
  | { readonly kind: 'off'; readonly next: DatedDay | null };

/**
 * Détermine ce que l'accueil affiche aujourd'hui. Le plan l'emporte sur l'école,
 * comme dans le planning : un plan validé avant le marquage reste affiché.
 *
 * @param plan - Plan en cours, `null` s'il n'y en a pas
 * @param schoolWeeks - Semaines d'école
 * @param today - Date du jour
 * @returns L'état de l'accueil
 */
export function todayStatus(
  plan: DatedPlan | null,
  schoolWeeks: SchoolWeeks,
  today: CalendarDate,
): TodayStatus {
  if (plan === null) {
    return { kind: 'no-plan' };
  }
  const day = plan.days.find((candidate) => candidate.date.equals(today));
  if (day !== undefined) {
    return { kind: 'work', day };
  }
  if (plan.recovery?.date.equals(today) === true) {
    return { kind: 'recovery', recovery: plan.recovery };
  }
  if (schoolWeeks.contains(today)) {
    return { kind: 'school' };
  }
  // Aujourd'hui avant le premier jour du plan : ce n'est pas un jour « sans travail »,
  // c'est un jour qui n'a pas été simulé (ex. plan validé pour la semaine prochaine).
  const [first] = plan.days;
  if (first !== undefined && today.isBefore(first.date)) {
    return { kind: 'before-plan', first };
  }
  return {
    kind: 'off',
    next: plan.days.find((candidate) => today.isBefore(candidate.date)) ?? null,
  };
}

/**
 * Jours planifiés restants de la semaine, après aujourd'hui (pour « Le reste de la semaine »).
 *
 * @param plan - Plan en cours
 * @param today - Date du jour
 * @returns Les journées planifiées d'ici dimanche, dans l'ordre
 */
export function restOfWeek(plan: DatedPlan, today: CalendarDate): readonly DatedDay[] {
  const nextMonday = today.startOfWeek().plusDays(DAYS_PER_WEEK);
  return plan.days.filter((day) => today.isBefore(day.date) && day.date.isBefore(nextMonday));
}
