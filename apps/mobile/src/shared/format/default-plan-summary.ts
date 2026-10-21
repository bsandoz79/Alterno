import type { DatedPlan } from '@alterno/engine';

/**
 * Phrase qui explique la semaine standard affichée faute de plan validé (ALT-51).
 *
 * @param plan - Semaine standard (`isDefault`)
 * @returns Le résumé : total et nombre de jours
 */
export function defaultPlanSummary(plan: DatedPlan): string {
  const days = plan.days.length;
  return `Aucun plan validé pour cette semaine : Alterno suit une semaine standard de ${plan.totalWorked.format()} sur ${String(days)} ${days === 1 ? 'jour' : 'jours'}, au rythme régulier.`;
}
