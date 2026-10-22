import type { CalendarDate, FixedDay, WorkedDayInput } from '@alterno/engine';

/** Journées aux horaires choisis (bloc étiré), par date (« AAAA-MM-JJ ») : elles sont verrouillées. */
export type EditedDays = Readonly<Record<string, WorkedDayInput>>;

/**
 * Retient les horaires choisis pour un jour : il devient verrouillé, le reste de l'objectif
 * sera réparti sur les autres jours.
 *
 * @param edits - Journées déjà choisies
 * @param date - Jour étiré
 * @param times - Arrivée, pause et départ choisis
 * @returns Les journées choisies, avec ce jour
 */
export function setDayTimes(
  edits: EditedDays,
  date: CalendarDate,
  times: WorkedDayInput,
): EditedDays {
  return { ...edits, [date.toIsoString()]: times };
}

/**
 * @param edits - Journées choisies
 * @param date - Jour à débloquer
 * @returns Les journées choisies, sans ce jour : le rythme le répartit de nouveau
 */
export function unlockDay(edits: EditedDays, date: CalendarDate): EditedDays {
  const key = date.toIsoString();
  return Object.fromEntries(Object.entries(edits).filter(([iso]) => iso !== key));
}

/**
 * Journées choisies qui font partie de la période affichée : les autres (période changée depuis)
 * sont ignorées plutôt que de bloquer la simulation.
 *
 * @param edits - Journées choisies
 * @param days - Jours de la période
 * @returns Les journées fixées pour le moteur, dans l'ordre de la période
 */
export function fixedDaysIn(edits: EditedDays, days: readonly CalendarDate[]): readonly FixedDay[] {
  return days.flatMap((date) => {
    const times = edits[date.toIsoString()];
    return times === undefined ? [] : [{ date, ...times }];
  });
}
