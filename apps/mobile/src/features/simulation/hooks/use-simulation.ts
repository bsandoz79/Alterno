import {
  DomainError,
  HoursCounter,
  SimulatePlan,
  buildWorkRules,
  laBrosseEtDupontSettings,
  planningPeriodDays,
  type CalendarDate,
  type Clock,
  type Duration,
  type PlanningPreferences,
  type Simulation,
  type WorkRules,
} from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { systemClock } from '@/shared/clock/system-clock';
import { useRepositories } from '@/shared/storage/repositories-context';

import {
  DEFAULT_SIMULATION_FORM,
  toSimulationRequest,
  type SimulationForm,
} from '../simulation-form';

/** Données chargées à l'ouverture de l'écran : règles (réglages ou preset), préférences et compteur. */
interface SimulationContext {
  readonly rules: WorkRules;
  readonly preferences: PlanningPreferences;
  readonly counter: HoursCounter;
}

/** Résultat affiché sous le formulaire. */
export type SimulationOutcome =
  | { readonly ok: true; readonly simulation: Simulation }
  | { readonly ok: false; readonly error: string };

/** État et actions de l'écran Simulation. */
export interface SimulationState {
  /** `null` pendant le chargement des règles et du compteur. */
  readonly context: SimulationContext | null;
  readonly form: SimulationForm;
  readonly update: (changes: Partial<SimulationForm>) => void;
  /** Jours où la récup peut être posée (jours de la période, sauf le premier). */
  readonly recoveryChoices: readonly CalendarDate[];
  /** Heures à faire en plus avant la récup choisie. */
  readonly hoursToCatchUp: Duration | null;
  readonly outcome: SimulationOutcome | null;
}

/**
 * Relie l'écran Simulation au cas d'usage `SimulatePlan` : charge les règles enregistrées (ou le preset),
 * les préférences et le compteur, puis recalcule le plan à chaque changement du formulaire.
 *
 * @param clock - Horloge (l'horloge système par défaut ; une horloge fixe en test)
 * @returns L'état de l'écran
 */
export function useSimulation(clock: Clock = systemClock): SimulationState {
  const { workRules, preferences, counter } = useRepositories();
  const [context, setContext] = useState<SimulationContext | null>(null);
  const [form, setForm] = useState<SimulationForm>(DEFAULT_SIMULATION_FORM);

  // Rechargé à chaque retour sur l'écran : les règles ou les préférences ont pu changer entre-temps.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([workRules.load(), preferences.load(), counter.load()]).then(
        ([settings, savedPreferences, balance]) => {
          if (active) {
            setContext({
              rules: buildWorkRules(settings ?? laBrosseEtDupontSettings()),
              preferences: savedPreferences,
              counter: balance,
            });
          }
        },
      );
      return () => {
        active = false;
      };
    }, [workRules, preferences, counter]),
  );

  const computed = useMemo(() => {
    if (context === null) {
      return { recoveryChoices: [], hoursToCatchUp: null, outcome: null };
    }
    try {
      const days = planningPeriodDays({
        today: clock.today(),
        start: form.start,
        weeks: form.weeks,
        rules: context.rules,
      });
      const recoveryChoices = days.slice(1);
      // Un jour choisi qui n'est plus dans la période (période modifiée) est oublié.
      const recoveryDate = recoveryChoices.some((day) => day.toIsoString() === form.recoveryDate)
        ? form.recoveryDate
        : null;
      // Des préférences devenues incompatibles (règles modifiées depuis) lèvent une erreur affichée.
      const simulatePlan = new SimulatePlan(context.rules, context.preferences);
      const request = toSimulationRequest({ ...form, recoveryDate }, days, context.counter);
      const outcome: SimulationOutcome = request.ok
        ? { ok: true, simulation: simulatePlan.execute(request.request) }
        : request;
      return {
        recoveryChoices,
        hoursToCatchUp: simulatePlan.hoursToCatchUp(context.counter, form.recoveryKind),
        outcome,
      };
    } catch (error) {
      // Erreurs métier (objectif impossible, période vide…) : affichées telles quelles.
      if (error instanceof DomainError) {
        return {
          recoveryChoices: [],
          hoursToCatchUp: null,
          outcome: { ok: false, error: error.message } as const,
        };
      }
      throw error;
    }
  }, [context, form, clock]);

  return {
    context,
    form,
    update: (changes) => {
      setForm((current) => ({ ...current, ...changes }));
    },
    ...computed,
  };
}
