import type { WorkRules } from '../rules/work-rules';
import { InvalidValueError } from '../shared/domain-error';
import type { CalendarDate } from './calendar-date';
import type { SchoolWeeks } from './school-weeks';

const DAYS_PER_WEEK = 7;

/**
 * Début d'une période de simulation :
 * - `this-week` : à partir d'aujourd'hui, jusqu'à la fin de la semaine (puis les semaines suivantes) ;
 * - `next-week` : à partir du lundi suivant.
 */
export type PeriodStart = 'this-week' | 'next-week';

/** Paramètres d'une période de simulation. */
export interface PlanningPeriodRequest {
  /** Date du jour (fournie par l'horloge, pour rester testable). */
  readonly today: CalendarDate;
  readonly start: PeriodStart;
  /** Nombre de semaines : 1, 2, ou 4 pour « 1 mois ». */
  readonly weeks: number;
  readonly rules: WorkRules;
  /** Semaines d'école à exclure ; aucune si absent. */
  readonly schoolWeeks?: SchoolWeeks;
}

/**
 * Jours travaillés d'une période de simulation, dans l'ordre.
 *
 * Les jours d'une semaine d'école sont exclus : on n'y planifie pas d'horaire en entreprise.
 *
 * @param request - Date du jour, début, nombre de semaines, règles (pour savoir quels jours sont travaillés)
 *   et semaines d'école
 * @returns Les dates travaillées en entreprise sur la période
 * @throws {InvalidValueError} Si la durée est inférieure à une semaine, si aucun jour n'est travaillé
 *   (« cette semaine » demandé un samedi) ou si la période ne contient que des jours d'école
 */
export function planningPeriodDays(request: PlanningPeriodRequest): readonly CalendarDate[] {
  const { today, start, weeks, rules, schoolWeeks } = request;
  if (!Number.isInteger(weeks) || weeks < 1) {
    throw new InvalidValueError('La période doit durer au moins une semaine.');
  }
  const thisMonday = today.startOfWeek();
  const firstMonday = start === 'next-week' ? thisMonday.plusDays(DAYS_PER_WEEK) : thisMonday;
  const from = start === 'next-week' ? firstMonday : today;
  const end = firstMonday.plusDays(DAYS_PER_WEEK * weeks);

  const days: CalendarDate[] = [];
  for (let date = from; date.isBefore(end); date = date.plusDays(1)) {
    if (rules.isWorkingDay(date.weekday())) {
      days.push(date);
    }
  }
  if (days.length === 0) {
    throw new InvalidValueError(
      'Plus aucun jour travaillé cette semaine : choisis « semaine prochaine ».',
    );
  }
  const atWork =
    schoolWeeks === undefined ? days : days.filter((date) => !schoolWeeks.contains(date));
  if (atWork.length === 0) {
    throw new InvalidValueError(
      'Que des jours d’école sur cette période : choisis une période plus longue.',
    );
  }
  return atWork;
}
