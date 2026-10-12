import {
  DEFAULT_PLANNING_HABITS,
  DomainError,
  TimeSlot,
  parseClockTime,
  validatePlanningPreferences,
  type DayPreferences,
  type PlanningPreferences,
  type TimeOfDay,
  type WorkRules,
} from '@alterno/engine';

/** Jours réglables (les deux groupes de règles couvrent le lundi au vendredi). */
export const PREFERENCE_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

/** Jour réglable. */
export type PreferenceDay = (typeof PREFERENCE_DAYS)[number];

/** Libellés français des jours réglables. */
export const PREFERENCE_DAY_LABELS: Readonly<Record<PreferenceDay, string>> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
};

/** Habitudes par défaut, telles que saisies. */
export interface HabitsForm {
  readonly arrival: string;
  readonly lunchStart: string;
  readonly lunchEnd: string;
}

/** Préférences d'un jour, telles que saisies. Un champ vide = habitude par défaut. */
export interface DayPreferencesForm {
  readonly arrival: string;
  readonly lunchStart: string;
  readonly lunchEnd: string;
  readonly latestDeparture: string;
  readonly exactlyExpected: boolean;
}

/** Contenu du formulaire des préférences. */
export interface PreferencesForm {
  readonly defaults: HabitsForm;
  readonly days: Readonly<Record<PreferenceDay, DayPreferencesForm>>;
}

/** Jour sans préférence particulière. */
export const EMPTY_DAY_FORM: DayPreferencesForm = {
  arrival: '',
  lunchStart: '',
  lunchEnd: '',
  latestDeparture: '',
  exactlyExpected: false,
};

/** Libellés des champs, pour les messages d'erreur et l'écran. */
export const FIELD_LABELS = {
  arrival: 'Arrivée',
  lunchStart: 'Début de pause',
  lunchEnd: 'Fin de pause',
  latestDeparture: 'Départ au plus tard',
} as const;

/** Résultat de la lecture du formulaire. */
export type PreferencesFormResult =
  | { readonly ok: true; readonly preferences: PlanningPreferences }
  | { readonly ok: false; readonly error: string };

/**
 * Remplit le formulaire depuis des préférences enregistrées (`{}` : habitudes par défaut, jours vides).
 *
 * @param preferences - Préférences enregistrées
 * @returns Le contenu du formulaire
 */
export function toPreferencesForm(preferences: PlanningPreferences): PreferencesForm {
  const habits = preferences.defaults ?? DEFAULT_PLANNING_HABITS;
  const days = Object.fromEntries(
    PREFERENCE_DAYS.map((day) => [day, toDayForm(preferences.days?.[day])]),
  ) as Record<PreferenceDay, DayPreferencesForm>;
  return {
    defaults: {
      arrival: habits.arrival.format(),
      lunchStart: habits.lunchBreak.start.format(),
      lunchEnd: habits.lunchBreak.end.format(),
    },
    days,
  };
}

/**
 * Lit le formulaire, puis vérifie avec le moteur que les préférences respectent les règles horaires.
 *
 * @param form - Contenu saisi
 * @param rules - Règles horaires en vigueur
 * @returns Les préférences validées, ou un message qui nomme le jour et le champ en cause
 */
export function parsePreferencesForm(
  form: PreferencesForm,
  rules: WorkRules,
): PreferencesFormResult {
  try {
    const defaults = {
      arrival: readTime('Mes habitudes', FIELD_LABELS.arrival, form.defaults.arrival),
      lunchBreak: TimeSlot.between(
        readTime('Mes habitudes', FIELD_LABELS.lunchStart, form.defaults.lunchStart),
        readTime('Mes habitudes', FIELD_LABELS.lunchEnd, form.defaults.lunchEnd),
      ),
    };
    const days: Partial<Record<PreferenceDay, DayPreferences>> = {};
    for (const day of PREFERENCE_DAYS) {
      const preferences = readDay(PREFERENCE_DAY_LABELS[day], form.days[day]);
      if (Object.keys(preferences).length > 0) {
        days[day] = preferences;
      }
    }
    const preferences: PlanningPreferences = { defaults, days };
    validatePlanningPreferences(rules, preferences);
    return { ok: true, preferences };
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

function toDayForm(day: DayPreferences | undefined): DayPreferencesForm {
  return {
    arrival: day?.arrival?.format() ?? '',
    lunchStart: day?.lunchBreak?.start.format() ?? '',
    lunchEnd: day?.lunchBreak?.end.format() ?? '',
    latestDeparture: day?.latestDeparture?.format() ?? '',
    exactlyExpected: day?.exactlyExpected === true,
  };
}

/** Préférences d'un jour : seuls les champs remplis sont retenus. */
function readDay(label: string, form: DayPreferencesForm): DayPreferences {
  const hasLunchStart = form.lunchStart.trim() !== '';
  const hasLunchEnd = form.lunchEnd.trim() !== '';
  if (hasLunchStart !== hasLunchEnd) {
    throw new FormFieldError(
      `${label} : indique le début et la fin de la pause, ou laisse les deux vides.`,
    );
  }
  const optionalTime = (field: keyof typeof FIELD_LABELS, value: string): TimeOfDay | null =>
    value.trim() === '' ? null : readTime(label, FIELD_LABELS[field], value);
  const arrival = optionalTime('arrival', form.arrival);
  const latestDeparture = optionalTime('latestDeparture', form.latestDeparture);
  const lunchStart = optionalTime('lunchStart', form.lunchStart);
  const lunchEnd = optionalTime('lunchEnd', form.lunchEnd);
  return {
    ...(arrival === null ? {} : { arrival }),
    ...(lunchStart === null || lunchEnd === null
      ? {}
      : { lunchBreak: TimeSlot.between(lunchStart, lunchEnd) }),
    ...(latestDeparture === null ? {} : { latestDeparture }),
    ...(form.exactlyExpected ? { exactlyExpected: true } : {}),
  };
}

function readTime(group: string, field: string, value: string): TimeOfDay {
  try {
    return parseClockTime(value);
  } catch {
    throw new FormFieldError(
      `${group} · ${field} : « ${value.trim()} » n’est pas une heure valide (ex. 8h30).`,
    );
  }
}

/** Champ illisible : traité comme une erreur métier pour être affiché tel quel. */
class FormFieldError extends DomainError {}
