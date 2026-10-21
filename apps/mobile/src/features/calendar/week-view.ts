import {
  Duration,
  type CalendarDate,
  type DatedDay,
  type DatedPlan,
  type DayPlan,
  type RecoveryDay,
  type RecoveryKind,
  type SchoolWeeks,
  type TimeOfDay,
} from '@alterno/engine';

const DAYS_SHOWN = 5;
const MINUTES_PER_HOUR = 60;
/** Plage affichée quand aucun jour n'est planifié dans la semaine. */
const DEFAULT_HOURS: GridHours = { start: 8, end: 18 };

/** Colonne de la grille : une date, sa journée planifiée si elle existe, et la récup si c'est ce jour-là. */
export interface WeekColumn {
  readonly date: CalendarDate;
  readonly day: DatedDay | null;
  /** Type de la récup du plan si elle tombe ce jour-là, sinon `null`. */
  readonly recovery: RecoveryKind | null;
}

/** Semaine affichée dans la grille, du lundi au vendredi. */
export interface WeekView {
  readonly monday: CalendarDate;
  readonly columns: readonly WeekColumn[];
  /** Temps travaillé prévu sur la semaine. */
  readonly total: Duration;
}

/** Début et fin d'un moment de la journée (présence ou repos). */
interface Span {
  readonly start: TimeOfDay;
  readonly end: TimeOfDay;
}

/** Heures pleines de début et de fin de la grille. */
export interface GridHours {
  readonly start: number;
  readonly end: number;
}

/** Libellé du repos dans l'EDT (« récup » reste réservé aux petits boutons). */
const REST_LABEL = 'Repos compensatoire';

/**
 * Bloc dessiné dans une colonne : travail, pause ou repos compensatoire,
 * positionné en fraction de la hauteur de la grille.
 */
export interface DayBlock {
  readonly kind: 'work' | 'lunch' | 'rest';
  readonly label: string;
  readonly top: number;
  readonly height: number;
}

/**
 * Semaine affichée à l'ouverture de l'écran : toujours celle d'aujourd'hui, même vide
 * (plan terminé ou pas encore commencé). Afficher une autre semaine faisait croire
 * qu'on était encore la semaine passée ; les flèches permettent d'aller voir les autres.
 *
 * @param plan - Plan en cours (validé)
 * @param today - Date du jour
 * @returns La semaine d'aujourd'hui, du lundi au vendredi
 */
export function selectWeek(plan: DatedPlan, today: CalendarDate): WeekView {
  return weekAt(plan, today);
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
    return {
      date,
      day: plan.days.find((day) => day.date.equals(date)) ?? null,
      recovery: plan.recovery?.date.equals(date) === true ? plan.recovery.kind : null,
    };
  });
  const total = columns.reduce(
    (sum, column) => (column.day === null ? sum : sum.plus(column.day.plan.worked)),
    Duration.zero(),
  );
  return { monday, columns, total };
}

/**
 * Plage d'heures de la grille : de l'heure pleine précédant la première arrivée
 * à l'heure pleine suivant le dernier départ de la semaine, demi-journée de récup comprise.
 *
 * @param week - Semaine affichée
 * @param recoveryDay - Horaires du jour de récup du plan, s'il y en a un
 * @returns Les heures de début et de fin
 */
export function gridHours(week: WeekView, recoveryDay: RecoveryDay | null = null): GridHours {
  const slots: Span[] = week.columns.flatMap((column) =>
    column.day === null ? [] : [{ start: column.day.plan.arrival, end: column.day.plan.departure }],
  );
  // Les horaires de la récup ne comptent que si elle tombe dans la semaine affichée.
  const recoveryShown = week.columns.some((column) => column.recovery !== null);
  if (recoveryShown && recoveryDay?.kind === 'half') {
    slots.push(recoveryDay.worked, recoveryDay.rest);
  }
  if (slots.length === 0) {
    return DEFAULT_HOURS;
  }
  const earliest = Math.min(...slots.map((slot) => slot.start.toMinutesSinceMidnight()));
  const latest = Math.max(...slots.map((slot) => slot.end.toMinutesSinceMidnight()));
  return {
    start: Math.floor(earliest / MINUTES_PER_HOUR),
    end: Math.ceil(latest / MINUTES_PER_HOUR),
  };
}

/**
 * Blocs d'une journée : travail du matin, pause, travail de l'après-midi ;
 * un seul bloc de travail si la pause n'a pas été prise (départ avant, arrivée après).
 *
 * @param day - Journée planifiée
 * @param hours - Plage d'heures de la grille
 * @returns Les blocs, positionnés en fraction de la hauteur de la grille
 */
export function dayBlocks(day: DayPlan, hours: GridHours): readonly DayBlock[] {
  const block = (kind: DayBlock['kind'], from: TimeOfDay, to: TimeOfDay): DayBlock =>
    placedBlock(kind, '', { start: from, end: to }, hours);
  // Même règle que le calcul du temps travaillé : la pause n'est prise que si l'on est là avant et après.
  const lunchTaken =
    day.arrival.isBefore(day.lunchBreak.start) && day.departure.isAfter(day.lunchBreak.end);
  if (!lunchTaken) {
    return [block('work', day.arrival, day.departure)];
  }
  return [
    block('work', day.arrival, day.lunchBreak.start),
    block('lunch', day.lunchBreak.start, day.lunchBreak.end),
    block('work', day.lunchBreak.end, day.departure),
  ];
}

/**
 * Blocs du jour de récup :
 * - journée complète : un bloc « Repos compensatoire » sur toute la hauteur ;
 * - demi-journée : la partie travaillée (sans pause), puis le repos avec ses horaires.
 *
 * @param day - Horaires du jour de récup
 * @param hours - Plage d'heures de la grille
 * @returns Les blocs, positionnés en fraction de la hauteur de la grille
 */
export function recoveryBlocks(day: RecoveryDay, hours: GridHours): readonly DayBlock[] {
  if (day.kind === 'full') {
    return [{ kind: 'rest', label: REST_LABEL, top: 0, height: 1 }];
  }
  const worked = placedBlock('work', '', day.worked, hours);
  const rest = placedBlock('rest', `${REST_LABEL} `, day.rest, hours);
  // Dans l'ordre de la journée : le repos vient d'abord quand c'est le matin.
  return day.part === 'morning' ? [rest, worked] : [worked, rest];
}

/** Bloc positionné dans la grille, avec ses horaires précédés d'un éventuel intitulé. */
function placedBlock(
  kind: DayBlock['kind'],
  title: string,
  span: Span,
  hours: GridHours,
): DayBlock {
  const gridStart = hours.start * MINUTES_PER_HOUR;
  const gridLength = (hours.end - hours.start) * MINUTES_PER_HOUR;
  return {
    kind,
    label: `${title}${span.start.format()} – ${span.end.format()}`,
    top: (span.start.toMinutesSinceMidnight() - gridStart) / gridLength,
    height: span.start.durationUntil(span.end).toMinutes() / gridLength,
  };
}

/**
 * Ce qu'affiche la case d'un jour :
 * - `work` : le jour est planifié ;
 * - `recovery` : c'est le jour de récup du plan ;
 * - `school` : pas de plan, et la semaine est marquée « école » ;
 * - `none` : pas de plan ce jour-là (ni récup ni école).
 * Le plan l'emporte sur l'école : un plan validé avant le marquage reste visible tant qu'il n'est pas refait.
 *
 * @param column - Date, journée planifiée éventuelle et récup éventuelle (absente dans la vue mois)
 * @param schoolWeeks - Semaines d'école marquées
 * @returns Le type de case
 */
export function dayKind(
  column: Pick<WeekColumn, 'date' | 'day'> & { readonly recovery?: RecoveryKind | null },
  schoolWeeks: SchoolWeeks,
): 'work' | 'recovery' | 'school' | 'none' {
  if (column.day !== null) {
    return 'work';
  }
  if (column.recovery !== undefined && column.recovery !== null) {
    return 'recovery';
  }
  return schoolWeeks.contains(column.date) ? 'school' : 'none';
}
