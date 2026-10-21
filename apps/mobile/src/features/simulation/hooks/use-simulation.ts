import {
  DomainError,
  HoursCounter,
  SimulatePlan,
  ValidatePlan,
  buildWorkRules,
  laBrosseEtDupontSettings,
  planningPeriodDays,
  type CalendarDate,
  type Clock,
  type Duration,
  type PlanningPreferences,
  type PaceComparison,
  type RecoveryChoice,
  type SchoolWeeks,
  type Simulation,
  type WorkRules,
} from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { systemClock } from '@/shared/clock/system-clock';
import type { FormMessage } from '@/shared/components/message-box';
import { useRepositories } from '@/shared/storage/repositories-context';

import { deficitNotice, selectableRecoveryDate } from '../recovery-choices';
import {
  DEFAULT_SIMULATION_FORM,
  toSimulationRequest,
  type SimulationForm,
} from '../simulation-form';

/** Données chargées à l'ouverture de l'écran : règles (réglages ou preset), préférences, compteur et semaines d'école. */
interface SimulationContext {
  readonly rules: WorkRules;
  readonly preferences: PlanningPreferences;
  readonly counter: HoursCounter;
  readonly schoolWeeks: SchoolWeeks;
}

/** Résultat affiché sous le formulaire. */
export type SimulationOutcome =
  | {
      readonly ok: true;
      /** Simulation du rythme choisi. */
      readonly simulation: Simulation;
      /** Simulation de chaque rythme, pour les comparer. */
      readonly comparison: PaceComparison;
    }
  | { readonly ok: false; readonly error: string };

/** État et actions de l'écran Simulation. */
export interface SimulationState {
  /** `null` pendant le chargement des règles et du compteur. */
  readonly context: SimulationContext | null;
  readonly form: SimulationForm;
  readonly update: (changes: Partial<SimulationForm>) => void;
  /** Jours proposés pour la récup (jours de la période, sauf le premier), possibles ou non. */
  readonly recoveryChoices: readonly RecoveryChoice[];
  /** Heures à faire en plus avant la récup pour finir à zéro. */
  readonly hoursToCatchUp: Duration | null;
  /** Avertissement si la récup choisie puise dans le découvert. */
  readonly deficitNotice: string | null;
  readonly outcome: SimulationOutcome | null;
  /** Valide la simulation affichée : elle devient le plan en cours. */
  readonly validate: () => Promise<void>;
  /** Message affiché après la validation. */
  readonly message: FormMessage | null;
}

/**
 * Relie l'écran Simulation au cas d'usage `SimulatePlan` : charge les règles enregistrées (ou le preset),
 * les préférences, le compteur et les semaines d'école, puis recalcule le plan à chaque changement du formulaire.
 *
 * @param clock - Horloge (l'horloge système par défaut ; une horloge fixe en test)
 * @returns L'état de l'écran
 */
export function useSimulation(clock: Clock = systemClock): SimulationState {
  const { workRules, preferences, counter, plans, schoolWeeks } = useRepositories();
  const [context, setContext] = useState<SimulationContext | null>(null);
  const [form, setForm] = useState<SimulationForm>(DEFAULT_SIMULATION_FORM);
  const [message, setMessage] = useState<FormMessage | null>(null);

  // Rechargé à chaque retour sur l'écran : les règles ou les préférences ont pu changer entre-temps.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([
        workRules.load(),
        preferences.load(),
        counter.load(),
        schoolWeeks.load(),
      ]).then(([settings, savedPreferences, balance, markedWeeks]) => {
        if (active) {
          setContext({
            rules: buildWorkRules(settings ?? laBrosseEtDupontSettings()),
            preferences: savedPreferences,
            counter: balance,
            schoolWeeks: markedWeeks,
          });
        }
      });
      return () => {
        active = false;
      };
    }, [workRules, preferences, counter, schoolWeeks]),
  );

  const computed = useMemo(() => {
    const empty = { recoveryChoices: [], hoursToCatchUp: null, deficitNotice: null };
    if (context === null) {
      return { ...empty, outcome: null };
    }
    let days: readonly CalendarDate[];
    let simulatePlan: SimulatePlan;
    try {
      days = planningPeriodDays({
        today: clock.today(),
        start: form.start,
        weeks: form.weeks,
        rules: context.rules,
        // Les jours d'école sont exclus : on ne planifie que les jours en entreprise.
        schoolWeeks: context.schoolWeeks,
      });
      // Des préférences devenues incompatibles (règles modifiées depuis) lèvent une erreur affichée.
      simulatePlan = new SimulatePlan(context.rules, context.preferences);
    } catch (error) {
      return { ...empty, outcome: domainErrorOutcome(error) };
    }

    // Calculés à part de la simulation : une récup impossible ne doit pas faire disparaître les jours.
    const recoveryChoices = simulatePlan.recoveryChoices(days, context.counter, form.recoveryKind);
    const recoveryDate = selectableRecoveryDate(recoveryChoices, form.recoveryDate);
    const recovery = {
      recoveryChoices,
      hoursToCatchUp: simulatePlan.hoursToCatchUp(context.counter, form.recoveryKind),
      deficitNotice: deficitNotice(recoveryChoices, recoveryDate),
    };
    const request = toSimulationRequest({ ...form, recoveryDate }, days, context.counter);
    if (!request.ok) {
      return { ...recovery, outcome: request };
    }
    try {
      // Les trois rythmes sont calculés d'un coup : les cartes affichent leur vrai graphique.
      const comparison = simulatePlan.compare(request.request);
      const outcome: SimulationOutcome = {
        ok: true,
        comparison,
        simulation: comparison[form.pace],
      };
      return { ...recovery, outcome };
    } catch (error) {
      return { ...recovery, outcome: domainErrorOutcome(error) };
    }
  }, [context, form, clock]);

  const { outcome } = computed;
  const validate = useCallback(async () => {
    if (outcome?.ok !== true) {
      return;
    }
    await new ValidatePlan(plans, clock).execute(outcome.simulation);
    setMessage({ kind: 'success', text: 'Plan validé : c’est maintenant ton plan en cours.' });
  }, [outcome, plans, clock]);

  return {
    context,
    form,
    update: (changes) => {
      setForm((current) => ({ ...current, ...changes }));
      setMessage(null);
    },
    validate,
    message,
    ...computed,
  };
}

/**
 * Erreur métier (objectif impossible, période vide…) transformée en message affiché tel quel.
 *
 * @param error - Erreur levée par le moteur
 * @returns Le résultat en erreur
 * @throws L'erreur elle-même si ce n'est pas une erreur métier (bug à ne pas masquer)
 */
function domainErrorOutcome(error: unknown): SimulationOutcome {
  if (error instanceof DomainError) {
    return { ok: false, error: error.message };
  }
  throw error;
}
