import {
  DomainError,
  EditPlanDays,
  type CalendarDate,
  type DatedPlan,
  type PlanningPreferences,
  type WorkRules,
} from '@alterno/engine';

import { MINUTES_PER_HOUR, type GridHours } from '@/shared/planning/day-blocks';
import { fixedDaysIn, type EditedDays } from '@/shared/planning/edited-days';

/** Aperçu de la semaine modifiée : le plan recalculé, ou ce qui ne va pas. */
export type WeekEditPreview =
  { readonly ok: true; readonly plan: DatedPlan } | { readonly ok: false; readonly error: string };

/** Ce dont l'aperçu a besoin. */
export interface WeekEditInput {
  readonly plan: DatedPlan;
  readonly today: CalendarDate;
  readonly edits: EditedDays;
  readonly rules: WorkRules;
  readonly preferences: PlanningPreferences;
}

/**
 * Recalcule le plan avec les jours étirés (cas d'usage `EditPlanDays`), sans rien enregistrer.
 *
 * @param input - Plan, date du jour, jours étirés, règles et préférences
 * @returns Le plan recalculé, ou le message à afficher (ce qui manque, règle enfreinte)
 */
export function previewWeekEdit(input: WeekEditInput): WeekEditPreview {
  const fixedDays = fixedDaysIn(
    input.edits,
    input.plan.days.map((day) => day.date),
  );
  if (fixedDays.length === 0) {
    return { ok: true, plan: input.plan };
  }
  try {
    const plan = new EditPlanDays(input.rules, input.preferences).execute({
      plan: input.plan,
      today: input.today,
      fixedDays,
    });
    return { ok: true, plan };
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/** Verdict affiché sous la semaine modifiée. */
export interface WeekEditVerdict {
  readonly kind: 'success' | 'info';
  readonly text: string;
}

/**
 * Dit si le plan modifié tient l'objectif, ou de combien il le dépasse (ou le manque).
 * L'écart n'est pas une erreur (ALT-69) : il ira au compteur, comme pour un écart déclaré.
 *
 * @param original - Plan avant modification (son total est l'objectif)
 * @param edited - Plan avec les jours étirés
 * @returns Le message, en vert si le plan tient
 */
export function weekEditVerdict(original: DatedPlan, edited: DatedPlan): WeekEditVerdict {
  const gap = edited.totalWorked.minus(original.totalWorked);
  const total = edited.totalWorked.format();
  if (gap.isZero()) {
    return { kind: 'success', text: `Le plan tient : ${total}, jours étirés compris.` };
  }
  return {
    kind: 'info',
    text: gap.isNegative()
      ? `${gap.abs().format()} de moins que le plan (${total}), pris sur ton compteur.`
      : `${gap.format({ signed: true })} au-delà du plan (${total}), pour ton compteur.`,
  };
}

/**
 * Seuls les jours planifiés à venir s'étirent : les jours passés sont déjà faits (et au compteur).
 *
 * @param date - Jour de la colonne
 * @param planned - `true` si le plan a une journée ce jour-là
 * @param today - Date du jour
 * @returns `true` si le bloc peut être étiré
 */
export function isStretchable(date: CalendarDate, planned: boolean, today: CalendarDate): boolean {
  return planned && !date.isBefore(today);
}

/**
 * Plage de la grille en mode modification : assez haute pour étirer chaque jour jusqu'à ses limites
 * (arrivée au plus tôt, départ au plus tard), lues dans les règles.
 *
 * @param rules - Règles horaires
 * @returns Les heures pleines de début et de fin
 */
export function stretchGridHours(rules: WorkRules): GridHours {
  const schedules = rules.workingDays().map((day) => rules.scheduleFor(day));
  const earliest = Math.min(
    ...schedules.map((schedule) => schedule.earliestArrival.toMinutesSinceMidnight()),
  );
  const latest = Math.max(
    ...schedules.map((schedule) => schedule.latestDeparture.toMinutesSinceMidnight()),
  );
  return {
    start: Math.floor(earliest / MINUTES_PER_HOUR),
    end: Math.ceil(latest / MINUTES_PER_HOUR),
  };
}
