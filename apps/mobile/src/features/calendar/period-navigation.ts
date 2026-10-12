import type { CalendarDate, DatedPlan, YearMonth } from '@alterno/engine';

const DAYS_PER_WEEK = 7;

/** Périodes voisines accessibles depuis la période affichée ; `null` quand on sortirait du plan. */
export interface Navigation<Period> {
  readonly previous: Period | null;
  readonly next: Period | null;
}

/** Premier et dernier jour planifiés. */
interface PlanBounds {
  readonly first: CalendarDate;
  readonly last: CalendarDate;
}

/**
 * Semaines voisines de la semaine affichée. On ne propose une semaine que s'il reste
 * des jours planifiés de ce côté : l'utilisateur ne se perd pas dans des semaines vides.
 * Une semaine vide au milieu du plan (semaine d'école) reste accessible.
 *
 * @param plan - Plan en cours
 * @param monday - Lundi de la semaine affichée
 * @returns Le lundi de la semaine précédente et de la suivante, ou `null`
 */
export function weekNavigation(plan: DatedPlan, monday: CalendarDate): Navigation<CalendarDate> {
  const nextMonday = monday.plusDays(DAYS_PER_WEEK);
  return boundedNavigation(plan, monday, nextMonday, {
    previous: monday.plusDays(-DAYS_PER_WEEK),
    next: nextMonday,
  });
}

/**
 * Mois voisins du mois affiché, avec la même règle que les semaines : seulement s'il reste
 * des jours planifiés de ce côté.
 *
 * @param plan - Plan en cours
 * @param month - Mois affiché
 * @returns Le mois précédent et le suivant, ou `null`
 */
export function monthNavigation(plan: DatedPlan, month: YearMonth): Navigation<YearMonth> {
  const next = month.plusMonths(1);
  return boundedNavigation(plan, month.firstDay(), next.firstDay(), {
    previous: month.plusMonths(-1),
    next,
  });
}

/**
 * Garde les périodes voisines qui contiennent encore des jours du plan.
 *
 * @param plan - Plan en cours
 * @param start - Premier jour de la période affichée
 * @param end - Premier jour de la période suivante
 * @param candidates - Périodes précédente et suivante
 * @returns Les candidates, remplacées par `null` quand le plan ne va pas jusque-là
 */
function boundedNavigation<Period>(
  plan: DatedPlan,
  start: CalendarDate,
  end: CalendarDate,
  candidates: { readonly previous: Period; readonly next: Period },
): Navigation<Period> {
  const bounds = planBounds(plan);
  if (bounds === null) {
    return { previous: null, next: null };
  }
  return {
    previous: bounds.first.isBefore(start) ? candidates.previous : null,
    next: bounds.last.isBefore(end) ? null : candidates.next,
  };
}

/**
 * @param plan - Plan en cours
 * @returns Son premier et son dernier jour, ou `null` si le plan est vide
 */
function planBounds(plan: DatedPlan): PlanBounds | null {
  const dates = plan.days.map((day) => day.date);
  const [head, ...rest] = dates;
  if (head === undefined) {
    return null;
  }
  return rest.reduce<PlanBounds>(
    (bounds, date) => ({
      first: date.isBefore(bounds.first) ? date : bounds.first,
      last: bounds.last.isBefore(date) ? date : bounds.last,
    }),
    { first: head, last: head },
  );
}
