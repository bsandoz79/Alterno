import {
  DeclareDeviation,
  DomainError,
  InvalidValueError,
  TimeSlot,
  parseClockTime,
  type ArrivalChoice,
  type CalendarDate,
  type DatedDeviationOutcome,
  type DatedPlan,
  type DayPlan,
  type Duration,
  type PaceName,
  type PlanningPreferences,
  type TimeOfDay,
  type WorkRules,
} from '@alterno/engine';

/** Saisie de l'écran « Modifier ce jour » : les heures en texte, telles que tapées, et le rythme. */
export interface DayEditForm {
  readonly arrival: string;
  readonly lunchStart: string;
  readonly lunchEnd: string;
  readonly departure: string;
  /** Rythme pour répartir le rattrapage sur les jours suivants (choisi à chaque modification). */
  readonly pace: PaceName;
  /** Quand le recalcul repousse une arrivée : garder le recalcul, son heure habituelle ou une heure choisie. */
  readonly arrivalChoice: ArrivalChoiceName;
  /** Heure choisie, telle que tapée (utilisée seulement avec `chosen`). */
  readonly chosenArrival: string;
}

/** Choix proposé quand le recalcul repousse l'arrivée de certains jours. */
export type ArrivalChoiceName = 'recalculated' | 'preferred' | 'chosen';

/** Champ horaire du formulaire. */
export type TimeFieldName = 'arrival' | 'lunchStart' | 'lunchEnd' | 'departure';

/** Libellés des heures, dans le formulaire et les messages d'erreur. */
export const FIELD_LABELS: Readonly<Record<TimeFieldName, string>> = {
  arrival: 'Arrivée',
  lunchStart: 'Début de pause',
  lunchEnd: 'Fin de pause',
  departure: 'Départ',
};

/** Jour suivant dont le temps prévu change avec le recalcul. */
export interface RecalculatedDay {
  readonly date: CalendarDate;
  /** Temps prévu avant la modification. */
  readonly before: Duration;
  /** Nouvelle journée prévue. */
  readonly after: DayPlan;
}

/** Aperçu affiché sous le formulaire : le recalcul, ou l'erreur de saisie. */
export type DayEditPreview =
  | {
      readonly ok: true;
      readonly outcome: DatedDeviationOutcome;
      readonly recalculated: readonly RecalculatedDay[];
      /** Effet du choix d'arrivée par rapport au recalcul (positif : en plus, pour le compteur). */
      readonly extra: Duration;
      /** Heure choisie illisible ou hors plage : le recalcul est gardé et ce message s'affiche. */
      readonly arrivalError: string | null;
    }
  | { readonly ok: false; readonly error: string };

/** Ce dont l'aperçu a besoin : le plan, le jour modifié, la saisie, les règles et les préférences. */
export interface DayEditInput {
  readonly plan: DatedPlan;
  readonly date: CalendarDate;
  readonly form: DayEditForm;
  readonly rules: WorkRules;
  readonly preferences: PlanningPreferences;
}

/**
 * Pré-remplit le formulaire avec les horaires prévus : l'utilisateur ne corrige que ce qui a changé.
 *
 * @param day - Journée prévue
 * @returns Le formulaire, rythme régulier par défaut
 */
export function dayEditFormFrom(day: DayPlan): DayEditForm {
  return {
    arrival: day.arrival.format(),
    lunchStart: day.lunchBreak.start.format(),
    lunchEnd: day.lunchBreak.end.format(),
    departure: day.departure.format(),
    pace: 'steady',
    arrivalChoice: 'recalculated',
    chosenArrival: '',
  };
}

/**
 * Calcule l'aperçu du recalcul pour la saisie en cours, sans rien enregistrer.
 *
 * @param input - Plan, jour, saisie, règles et préférences
 * @returns Le plan recalculé et les jours suivants modifiés, ou un message d'erreur à afficher
 */
export function previewDayEdit(input: DayEditInput): DayEditPreview {
  const { plan, date, form } = input;
  try {
    const actual = {
      arrival: time(form, 'arrival'),
      lunchBreak: TimeSlot.between(time(form, 'lunchStart'), time(form, 'lunchEnd')),
      departure: time(form, 'departure'),
    };
    const declare = new DeclareDeviation(input.rules, input.preferences);
    const request = { plan, date, actual, pace: form.pace };
    const recalculated = declare.execute(request);
    let outcome = recalculated;
    let arrivalError: string | null = null;
    if (form.arrivalChoice !== 'recalculated' && recalculated.lateArrivals.length > 0) {
      // Une heure choisie invalide ne doit pas masquer le recalcul : on le garde et on signale l'heure.
      try {
        outcome = declare.execute({ ...request, arrival: arrivalChoiceOf(form) });
      } catch (error) {
        if (!(error instanceof DomainError)) {
          throw error;
        }
        arrivalError = error.message;
      }
    }
    return {
      ok: true,
      outcome,
      recalculated: recalculatedDays(plan, outcome.plan, date),
      extra: outcome.plan.totalWorked.minus(recalculated.plan.totalWorked),
      arrivalError,
    };
  } catch (error) {
    // Erreurs métier (heures incohérentes, pause à l'envers…) : affichées telles quelles.
    if (error instanceof DomainError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/** Traduit le choix de l'écran pour le moteur. */
function arrivalChoiceOf(form: DayEditForm): ArrivalChoice {
  if (form.arrivalChoice === 'preferred') {
    return { kind: 'preferred' };
  }
  try {
    return { kind: 'chosen', arrival: parseClockTime(form.chosenArrival) };
  } catch {
    throw new InvalidValueError(
      `Arrivée choisie : « ${form.chosenArrival.trim()} » n’est pas une heure valide (ex. 8h30).`,
    );
  }
}

/**
 * Lit une heure du formulaire, avec un message qui nomme le champ en cas d'erreur.
 *
 * @throws {InvalidValueError} Si la saisie n'est pas une heure
 */
function time(form: DayEditForm, field: TimeFieldName): TimeOfDay {
  try {
    return parseClockTime(form[field]);
  } catch {
    throw new InvalidValueError(
      `${FIELD_LABELS[field]} : « ${form[field].trim()} » n’est pas une heure valide (ex. 16h30).`,
    );
  }
}

/** Jours après le jour modifié dont le temps prévu a changé. */
function recalculatedDays(
  before: DatedPlan,
  after: DatedPlan,
  date: CalendarDate,
): readonly RecalculatedDay[] {
  return after.days.flatMap((day) => {
    const previous = before.days.find((candidate) => candidate.date.equals(day.date));
    if (!date.isBefore(day.date) || previous === undefined) {
      return [];
    }
    return previous.plan.worked.equals(day.plan.worked)
      ? []
      : [{ date: day.date, before: previous.plan.worked, after: day.plan }];
  });
}

/**
 * Le plan devient-il irréalisable avec cet écart (objectif hors d'atteinte même en journées maximales) ?
 * Dans ce cas, l'écran propose d'annuler la suite du plan plutôt que de prendre le manque sur le compteur.
 *
 * @param preview - Aperçu du recalcul
 * @returns `true` si l'alerte « objectif hors d'atteinte » est levée
 */
export function isOutOfReach(preview: DayEditPreview): boolean {
  return preview.ok && preview.outcome.alerts.some((alert) => alert.kind === 'target-out-of-reach');
}
