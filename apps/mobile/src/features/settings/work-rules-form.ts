import {
  DomainError,
  parseBalance,
  parseClockTime,
  type DayTimes,
  type Duration,
  type TimeOfDay,
  type WorkRulesSettings,
  buildWorkRules,
} from '@alterno/engine';

/** Les six heures d'un groupe de jours, telles que saisies (texte libre). */
export type DayTimesForm = Readonly<Record<keyof DayTimes, string>>;

/** Champs de durée du formulaire. */
export type DurationField =
  'minimumLunchBreak' | 'expectedDailyWork' | 'fullDayRecovery' | 'halfDayRecovery';

/** Groupes de jours du formulaire. */
export type DayGroup = 'mondayToThursday' | 'friday';

/** Contenu du formulaire des règles horaires : du texte, validé seulement à l'enregistrement. */
export interface WorkRulesForm extends Readonly<Record<DurationField, string>> {
  readonly mondayToThursday: DayTimesForm;
  readonly friday: DayTimesForm;
}

/** Résultat de la lecture du formulaire. */
export type WorkRulesFormResult =
  | { readonly ok: true; readonly settings: WorkRulesSettings }
  | { readonly ok: false; readonly error: string };

/** Libellés des groupes de jours. */
export const DAY_GROUP_LABELS: Readonly<Record<DayGroup, string>> = {
  mondayToThursday: 'Lundi–jeudi',
  friday: 'Vendredi',
};

/** Libellés des champs d'heure. */
export const DAY_TIME_LABELS: Readonly<Record<keyof DayTimes, string>> = {
  earliestArrival: 'Arrivée au plus tôt',
  coreStart: 'Début de la plage fixe',
  lunchStart: 'Début de la pause',
  lunchEnd: 'Fin de la pause',
  coreEnd: 'Fin de la plage fixe',
  latestDeparture: 'Départ au plus tard',
};

/** Champs d'heure d'un groupe, dans l'ordre de la journée. */
export const DAY_TIME_FIELDS: readonly (keyof DayTimes)[] = [
  'earliestArrival',
  'coreStart',
  'lunchStart',
  'lunchEnd',
  'coreEnd',
  'latestDeparture',
];

/** Libellés des champs de durée. */
export const DURATION_LABELS: Readonly<Record<DurationField, string>> = {
  minimumLunchBreak: 'Pause minimale',
  expectedDailyWork: 'Temps attendu par jour',
  fullDayRecovery: 'Journée de récup',
  halfDayRecovery: 'Demi-journée de récup',
};

/** Champs de durée, dans l'ordre d'affichage. */
export const DURATION_FIELDS: readonly DurationField[] = [
  'minimumLunchBreak',
  'expectedDailyWork',
  'fullDayRecovery',
  'halfDayRecovery',
];

/**
 * Remplit le formulaire à partir de réglages (enregistrés ou preset), au format français.
 *
 * @param settings - Réglages à afficher
 * @returns Le contenu du formulaire
 */
export function toWorkRulesForm(settings: WorkRulesSettings): WorkRulesForm {
  return {
    mondayToThursday: toDayTimesForm(settings.mondayToThursday),
    friday: toDayTimesForm(settings.friday),
    minimumLunchBreak: settings.minimumLunchBreak.format(),
    expectedDailyWork: settings.expectedDailyWork.format(),
    fullDayRecovery: settings.fullDayRecovery.format(),
    halfDayRecovery: settings.halfDayRecovery.format(),
  };
}

/**
 * Lit et valide le formulaire : chaque champ doit être lisible, puis les règles doivent être cohérentes.
 *
 * @param form - Contenu saisi
 * @returns Les réglages validés, ou un message d'erreur qui nomme le champ ou la règle en cause
 */
export function parseWorkRulesForm(form: WorkRulesForm): WorkRulesFormResult {
  try {
    const settings: WorkRulesSettings = {
      mondayToThursday: parseDayTimes('mondayToThursday', form.mondayToThursday),
      friday: parseDayTimes('friday', form.friday),
      minimumLunchBreak: parseDuration(form, 'minimumLunchBreak'),
      expectedDailyWork: parseDuration(form, 'expectedDailyWork'),
      fullDayRecovery: parseDuration(form, 'fullDayRecovery'),
      halfDayRecovery: parseDuration(form, 'halfDayRecovery'),
    };
    // Les règles métier (ordre des heures, pause minimale…) sont vérifiées par le moteur, pas ici.
    buildWorkRules(settings);
    return { ok: true, settings };
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

function toDayTimesForm(times: DayTimes): DayTimesForm {
  return {
    earliestArrival: times.earliestArrival.format(),
    coreStart: times.coreStart.format(),
    lunchStart: times.lunchStart.format(),
    lunchEnd: times.lunchEnd.format(),
    coreEnd: times.coreEnd.format(),
    latestDeparture: times.latestDeparture.format(),
  };
}

function parseDayTimes(group: DayGroup, form: DayTimesForm): DayTimes {
  const time = (key: keyof DayTimes): TimeOfDay => {
    try {
      return parseClockTime(form[key]);
    } catch {
      throw new FormFieldError(
        `${DAY_GROUP_LABELS[group]} · ${DAY_TIME_LABELS[key]} : « ${form[key].trim()} » n’est pas une heure valide (ex. 7h30).`,
      );
    }
  };
  return {
    earliestArrival: time('earliestArrival'),
    coreStart: time('coreStart'),
    lunchStart: time('lunchStart'),
    lunchEnd: time('lunchEnd'),
    coreEnd: time('coreEnd'),
    latestDeparture: time('latestDeparture'),
  };
}

function parseDuration(form: WorkRulesForm, key: DurationField): Duration {
  try {
    return parseBalance(form[key]);
  } catch {
    throw new FormFieldError(
      `${DURATION_LABELS[key]} : « ${form[key].trim()} » n’est pas une durée valide (ex. 0h45 ou 7h).`,
    );
  }
}

/** Champ illisible : traité comme une erreur métier pour être affiché tel quel. */
class FormFieldError extends DomainError {}
