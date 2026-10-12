import { buildWorkRules, laBrosseEtDupontSettings, type WorkRules } from '@alterno/engine';
import { useCallback, useEffect, useState } from 'react';

import type { FormMessage } from '@/shared/components/message-box';
import { useRepositories } from '@/shared/storage/repositories-context';

import {
  parsePreferencesForm,
  toPreferencesForm,
  type DayPreferencesForm,
  type HabitsForm,
  type PreferenceDay,
  type PreferencesForm,
} from '../preferences-form';

/** État et actions de l'écran des préférences. */
export interface PlanningPreferencesState {
  /** `null` pendant le chargement. */
  readonly form: PreferencesForm | null;
  readonly message: FormMessage | null;
  readonly updateHabit: (key: keyof HabitsForm, value: string) => void;
  readonly updateDay: <K extends keyof DayPreferencesForm>(
    day: PreferenceDay,
    key: K,
    value: DayPreferencesForm[K],
  ) => void;
  readonly save: () => Promise<void>;
  readonly reset: () => void;
}

/**
 * Charge, modifie et enregistre les préférences de planification.
 * Les règles horaires en vigueur servent à valider les préférences avant l'enregistrement.
 *
 * @returns L'état du formulaire et ses actions
 */
export function usePlanningPreferences(): PlanningPreferencesState {
  const { preferences, workRules } = useRepositories();
  const [form, setForm] = useState<PreferencesForm | null>(null);
  const [rules, setRules] = useState<WorkRules | null>(null);
  const [message, setMessage] = useState<FormMessage | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([preferences.load(), workRules.load()]).then(([saved, settings]) => {
      if (active) {
        setForm(toPreferencesForm(saved));
        setRules(buildWorkRules(settings ?? laBrosseEtDupontSettings()));
      }
    });
    return () => {
      active = false;
    };
  }, [preferences, workRules]);

  const updateHabit = useCallback((key: keyof HabitsForm, value: string) => {
    setForm((current) =>
      current === null ? current : { ...current, defaults: { ...current.defaults, [key]: value } },
    );
    setMessage(null);
  }, []);

  const updateDay = useCallback(
    <K extends keyof DayPreferencesForm>(
      day: PreferenceDay,
      key: K,
      value: DayPreferencesForm[K],
    ) => {
      setForm((current) =>
        current === null
          ? current
          : {
              ...current,
              days: { ...current.days, [day]: { ...current.days[day], [key]: value } },
            },
      );
      setMessage(null);
    },
    [],
  );

  const save = useCallback(async () => {
    if (form === null || rules === null) {
      return;
    }
    const result = parsePreferencesForm(form, rules);
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error });
      return;
    }
    await preferences.save(result.preferences);
    setMessage({ kind: 'success', text: 'Préférences enregistrées.' });
  }, [form, rules, preferences]);

  const reset = useCallback(() => {
    setForm(toPreferencesForm({}));
    setMessage({
      kind: 'info',
      text: 'Préférences remises à zéro (8h00, pause 12h15–13h00). Enregistre pour le garder.',
    });
  }, []);

  return { form, message, updateHabit, updateDay, save, reset };
}
