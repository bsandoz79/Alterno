import { laBrosseEtDupontSettings } from '@alterno/engine';
import { useCallback, useEffect, useState } from 'react';

import { useRepositories } from '@/shared/storage/repositories-context';

import {
  parseWorkRulesForm,
  toWorkRulesForm,
  type DayGroup,
  type DayTimesForm,
  type DurationField,
  type WorkRulesForm,
} from '../work-rules-form';

/** Message affiché sous le formulaire. */
export interface SettingsMessage {
  readonly kind: 'success' | 'error' | 'info';
  readonly text: string;
}

/** État et actions de l'écran des règles horaires. */
export interface WorkRulesSettingsState {
  /** Contenu du formulaire, `null` pendant le chargement. */
  readonly form: WorkRulesForm | null;
  readonly message: SettingsMessage | null;
  readonly updateDayTime: (group: DayGroup, key: keyof DayTimesForm, value: string) => void;
  readonly updateDuration: (key: DurationField, value: string) => void;
  readonly save: () => Promise<void>;
  readonly resetToPreset: () => void;
}

/**
 * Charge, modifie et enregistre les réglages des règles horaires.
 * Le composant n'accède jamais au stockage : il passe par ce hook, qui passe par le dépôt.
 *
 * @returns L'état du formulaire et ses actions
 */
export function useWorkRulesSettings(): WorkRulesSettingsState {
  const { workRules } = useRepositories();
  const [form, setForm] = useState<WorkRulesForm | null>(null);
  const [message, setMessage] = useState<SettingsMessage | null>(null);

  useEffect(() => {
    // Évite de modifier l'état d'un écran déjà quitté si le chargement finit après.
    let active = true;
    void workRules.load().then((settings) => {
      if (active) {
        setForm(toWorkRulesForm(settings ?? laBrosseEtDupontSettings()));
      }
    });
    return () => {
      active = false;
    };
  }, [workRules]);

  const updateDayTime = useCallback((group: DayGroup, key: keyof DayTimesForm, value: string) => {
    setForm((current) =>
      current === null ? current : { ...current, [group]: { ...current[group], [key]: value } },
    );
    setMessage(null);
  }, []);

  const updateDuration = useCallback((key: DurationField, value: string) => {
    setForm((current) => (current === null ? current : { ...current, [key]: value }));
    setMessage(null);
  }, []);

  const save = useCallback(async () => {
    if (form === null) {
      return;
    }
    const result = parseWorkRulesForm(form);
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error });
      return;
    }
    await workRules.save(result.settings);
    setForm(toWorkRulesForm(result.settings));
    setMessage({ kind: 'success', text: 'Règles horaires enregistrées.' });
  }, [form, workRules]);

  const resetToPreset = useCallback(() => {
    setForm(toWorkRulesForm(laBrosseEtDupontSettings()));
    setMessage({
      kind: 'info',
      text: 'Preset La Brosse et Dupont rétabli. Enregistre pour le garder.',
    });
  }, []);

  return { form, message, updateDayTime, updateDuration, save, resetToPreset };
}
