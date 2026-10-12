import {
  Duration,
  type CalendarDate,
  type DatedDay,
  type DatedPlan,
  type DayPlan,
  type SchoolWeeks,
  type TimeOfDay,
} from '@alterno/engine';

const DAYS_SHOWN = 5;
const MINUTES_PER_HOUR = 60;
/** Plage affichée quand aucun jour n'est planifié dans la semaine. */
const DEFAULT_HOURS: GridHours = { start: 8, end: 18 };

/** Colonne de la grille : une date, et sa journée planifiée si elle existe (sinon jour sans plan, ex. récup). */
export interface WeekColumn {
  readonly date: CalendarDate;
  readonly day: DatedDay | null;
}

/** Semaine affichée dans la grille, du lundi au vendredi. */
export interface WeekView {
  readonly monday: CalendarDate;
  readonly columns: readonly WeekColumn[];
  /** Temps travaillé prévu sur la semaine. */
  readonly total: Duration;
}

/** Heures pleines de début et de fin de la grille. */
export interface GridHours {
  readonly start: number;
  readonly end: number;
}

/** Bloc dessiné dans une colonne : travail ou pause, positionné en fraction de la hauteur de la grille. */
export interface DayBlock {
  readonly kind: 'work' | 'lunch';
  readonly label: string;
  readonly top: number;
  readonly height: number;
}

/**
 * Choisit la semaine du plan à afficher : celle d'aujourd'hui si le plan la couvre,
 * sinon la prochaine semaine planifiée, sinon la dernière (plan terminé).
 *
 * @param plan - Plan en cours (validé)
 * @param today - Date du jour
 * @returns La semaine à afficher, du lundi au vendredi
 */
export function selectWeek(plan: DatedPlan, today: CalendarDate): WeekView {
  const mondays = plan.days.map((day) => day.date.startOfWeek());
  const thisMonday = today.startOfWeek();
  const monday =
    mondays.find((candidate) => candidate.equals(thisMonday)) ??
    mondays.find((candidate) => thisMonday.isBefore(candidate)) ??
    mondays.at(-1) ??
    thisMonday;

  return weekAt(plan, monday);
}

/**
 * Semaine du plan contenant la date donnée (utilisée par la navigation semaine par semaine).
 * Une semaine hors du plan est renvoyée vide, avec un total nul.
 *
 * @param plan - Plan en cours (validé)
 * @param anyDay - N'importe quel jour de la semaine voulue
 * @returns La semaine, du lundi au vendredi
 */
export function weekAt(plan: DatedPlan, anyDay: CalendarDate): WeekView {
  const monday = anyDay.startOfWeek();
  const columns = Array.from({ length: DAYS_SHOWN }, (_, index) => {
    const date = monday.plusDays(index);
    return { date, day: plan.days.find((day) => day.date.equals(date)) ?? null };
  });
  const total = columns.reduce(
    (sum, column) => (column.day === null ? sum : sum.plus(column.day.plan.worked)),
    Duration.zero(),
  );
  return { monday, columns, total };
}

/**
 * Plage d'heures de la grille : de l'heure pleine précédant la première arrivée
 * à l'heure pleine suivant le dernier départ de la semaine.
 *
 * @param week - Semaine affichée
 * @returns Les heures de début et de fin
 */
export function gridHours(week: WeekView): GridHours {
  const days = week.columns.flatMap((column) => (column.day === null ? [] : [column.day.plan]));
  if (days.length === 0) {
    return DEFAULT_HOURS;
  }
  const earliest = Math.min(...days.map((day) => day.arrival.toMinutesSinceMidnight()));
  const latest = Math.max(...days.map((day) => day.departure.toMinutesSinceMidnight()));
  return {
    start: Math.floor(earliest / MINUTES_PER_HOUR),
    end: Math.ceil(latest / MINUTES_PER_HOUR),
  };
}

/**
 * Blocs d'une journée : travail du matin, pause, travail de l'après-midi.
 *
 * @param day - Journée planifiée
 * @param hours - Plage d'heures de la grille
 * @returns Les blocs, positionnés en fraction de la hauteur de la grille
 */
export function dayBlocks(day: DayPlan, hours: GridHours): readonly DayBlock[] {
  const gridStart = hours.start * MINUTES_PER_HOUR;
  const gridLength = (hours.end - hours.start) * MINUTES_PER_HOUR;
  const block = (kind: DayBlock['kind'], from: TimeOfDay, to: TimeOfDay): DayBlock => ({
    kind,
    label: `${from.format()} – ${to.format()}`,
    top: (from.toMinutesSinceMidnight() - gridStart) / gridLength,
    height: from.durationUntil(to).toMinutes() / gridLength,
  });
  return [
    block('work', day.arrival, day.lunchBreak.start),
    block('lunch', day.lunchBreak.start, day.lunchBreak.end),
    block('work', day.lunchBreak.end, day.departure),
  ];
}

/**
 * Ce qu'affiche la case d'un jour :
 * - `work` : le jour est planifié ;
 * - `school` : pas de plan, et la semaine est marquée « école » ;
 * - `off` : pas de plan un jour d'entreprise (récup).
 * Le plan l'emporte sur l'école : un plan validé avant le marquage reste visible tant qu'il n'est pas refait.
 *
 * @param column - Date et journée planifiée éventuelle
 * @param schoolWeeks - Semaines d'école marquées
 * @returns Le type de case
 */
export function dayKind(
  column: Pick<WeekColumn, 'date' | 'day'>,
  schoolWeeks: SchoolWeeks,
): 'work' | 'school' | 'off' {
  if (column.day !== null) {
    return 'work';
  }
  return schoolWeeks.contains(column.date) ? 'school' : 'off';
}
