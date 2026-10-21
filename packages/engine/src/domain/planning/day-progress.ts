import { Duration } from '../time/duration';
import type { TimeOfDay } from '../time/time-of-day';
import type { DayPlan } from './plan';

/**
 * Où en est la journée de travail :
 * - `before-start` : pas encore arrivé ; toute la journée reste à faire ;
 * - `working` : au travail ; temps restant avant le départ prévu, pause déduite ;
 * - `lunch` : pendant la pause ; elle finit à `lunchEnd`, puis il reste `remaining` ;
 * - `overtime` : départ prévu atteint ou dépassé, de `beyond` ;
 * - `day-over` : bien après le départ prévu : la journée est terminée (on est sans doute parti).
 */
export type DayProgress =
  | { readonly kind: 'before-start'; readonly arrival: TimeOfDay; readonly remaining: Duration }
  | { readonly kind: 'working'; readonly departure: TimeOfDay; readonly remaining: Duration }
  | {
      readonly kind: 'lunch';
      readonly lunchEnd: TimeOfDay;
      readonly departure: TimeOfDay;
      readonly remaining: Duration;
    }
  | { readonly kind: 'overtime'; readonly departure: TimeOfDay; readonly beyond: Duration }
  | { readonly kind: 'day-over'; readonly departure: TimeOfDay };

/**
 * Délai après le départ prévu au-delà duquel la journée est considérée comme terminée :
 * passé ce délai, afficher « +6h43 au-delà du départ » le soir n'a plus de sens.
 */
export const DEFAULT_DAY_OVER_AFTER = Duration.ofHours(1);

/**
 * Temps restant à travailler aujourd'hui, à la minute près : le temps prévu moins ce qui est déjà fait.
 * La pause n'est comptée que si elle est prise (présence avant et après), comme pour le temps travaillé.
 *
 * @param day - Journée prévue
 * @param now - Heure actuelle (fournie par l'horloge)
 * @param dayOverAfter - Délai après le départ prévu au bout duquel la journée est terminée (1h par défaut)
 * @returns L'avancement de la journée
 */
export function dayProgress(
  day: DayPlan,
  now: TimeOfDay,
  dayOverAfter: Duration = DEFAULT_DAY_OVER_AFTER,
): DayProgress {
  if (now.isBefore(day.arrival)) {
    return { kind: 'before-start', arrival: day.arrival, remaining: day.worked };
  }
  if (!now.isBefore(day.departure)) {
    const beyond = day.departure.durationUntil(now);
    return beyond.isLessThan(dayOverAfter)
      ? { kind: 'overtime', departure: day.departure, beyond }
      : { kind: 'day-over', departure: day.departure };
  }
  const remaining = atLeastZero(day.worked.minus(workedSoFar(day, now)));
  const { lunchBreak } = day;
  const inLunch =
    lunchTaken(day) && !now.isBefore(lunchBreak.start) && now.isBefore(lunchBreak.end);
  return inLunch
    ? { kind: 'lunch', lunchEnd: lunchBreak.end, departure: day.departure, remaining }
    : { kind: 'working', departure: day.departure, remaining };
}

/** Temps déjà travaillé entre l'arrivée et maintenant, sans la part de pause déjà écoulée. */
function workedSoFar(day: DayPlan, now: TimeOfDay): Duration {
  const present = day.arrival.durationUntil(now);
  if (!lunchTaken(day) || !now.isAfter(day.lunchBreak.start)) {
    return present;
  }
  const lunchEnd = now.isBefore(day.lunchBreak.end) ? now : day.lunchBreak.end;
  return present.minus(day.lunchBreak.start.durationUntil(lunchEnd));
}

/** Même règle que le temps travaillé : la pause n'est prise que si l'on est là avant et après. */
function lunchTaken(day: DayPlan): boolean {
  return day.arrival.isBefore(day.lunchBreak.start) && day.departure.isAfter(day.lunchBreak.end);
}

/** La durée, ou zéro si elle est négative. */
function atLeastZero(duration: Duration): Duration {
  return duration.isNegative() ? Duration.zero() : duration;
}
