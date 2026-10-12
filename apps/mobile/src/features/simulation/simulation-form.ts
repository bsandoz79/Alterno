import {
  CalendarDate,
  parseBalance,
  type HoursCounter,
  type PaceName,
  type PeriodStart,
  type RecoveryKind,
  type SimulationRequest,
} from '@alterno/engine';

/** Objectif choisi à l'écran. */
export type ObjectiveKind = 'hours' | 'recovery';

/** Durées proposées : 1 semaine, 2 semaines, 1 mois (4 semaines). */
export type PeriodWeeks = 1 | 2 | 4;

/** Contenu du formulaire de simulation. */
export interface SimulationForm {
  readonly start: PeriodStart;
  readonly weeks: PeriodWeeks;
  readonly objective: ObjectiveKind;
  /** Objectif d'heures saisi (texte libre, ex. « 41h »). */
  readonly target: string;
  /** Jour de récup choisi (« AAAA-MM-JJ »), `null` tant qu'aucun n'est choisi. */
  readonly recoveryDate: string | null;
  readonly recoveryKind: RecoveryKind;
  readonly pace: PaceName;
}

/** Valeurs de départ : la semaine prochaine, 35h (compteur neutre), rythme régulier. */
export const DEFAULT_SIMULATION_FORM: SimulationForm = {
  start: 'next-week',
  weeks: 1,
  objective: 'hours',
  target: '35h',
  recoveryDate: null,
  recoveryKind: 'full',
  pace: 'steady',
};

/** Résultat de la lecture du formulaire. */
export type SimulationRequestResult =
  | { readonly ok: true; readonly request: SimulationRequest }
  | { readonly ok: false; readonly error: string };

/**
 * Transforme le formulaire en demande pour le cas d'usage `SimulatePlan`.
 *
 * @param form - Contenu du formulaire
 * @param days - Jours travaillés de la période choisie
 * @param counter - Compteur actuel
 * @returns La demande, ou un message qui dit quoi corriger
 */
export function toSimulationRequest(
  form: SimulationForm,
  days: readonly CalendarDate[],
  counter: HoursCounter,
): SimulationRequestResult {
  const base = { days, pace: form.pace, counter };
  if (form.objective === 'recovery') {
    if (form.recoveryDate === null) {
      return { ok: false, error: 'Choisis le jour de la récup.' };
    }
    return {
      ok: true,
      request: {
        ...base,
        objective: {
          kind: 'recovery',
          date: CalendarDate.fromIsoString(form.recoveryDate),
          recovery: form.recoveryKind,
        },
      },
    };
  }
  try {
    return {
      ok: true,
      request: { ...base, objective: { kind: 'hours', target: parseBalance(form.target) } },
    };
  } catch {
    return {
      ok: false,
      error: `Objectif d’heures : « ${form.target.trim()} » n’est pas une durée valide (ex. 41h).`,
    };
  }
}
