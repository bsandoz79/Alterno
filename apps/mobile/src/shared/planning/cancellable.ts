import type { CalendarDate, DatedPlan } from '@alterno/engine';

/**
 * Un plan s'annule s'il a été validé (la semaine standard n'est pas enregistrée)
 * et qu'il reste quelque chose à venir : un jour planifié ou la récup.
 *
 * @param plan - Plan en cours
 * @param today - Date du jour
 * @returns `true` si le bouton « Annuler le plan » a du sens
 */
export function canCancelPlan(plan: DatedPlan, today: CalendarDate): boolean {
  if (plan.isDefault === true) {
    return false;
  }
  return plan.days.some((day) => !day.date.isBefore(today)) || canCancelRecovery(plan, today);
}

/**
 * Une récup s'annule tant qu'elle n'est pas passée (le jour même compris).
 *
 * @param plan - Plan en cours
 * @param today - Date du jour
 * @returns `true` si le plan a une récup aujourd'hui ou plus tard
 */
export function canCancelRecovery(plan: DatedPlan, today: CalendarDate): boolean {
  return plan.recovery !== undefined && !plan.recovery.date.isBefore(today);
}
