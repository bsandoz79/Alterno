import { ValidatePlan, type CalendarDate, type DayPlan } from '@alterno/engine';
import { useCallback, useMemo, useState } from 'react';

import type { FormMessage } from '@/shared/components/message-box';
import { systemClock } from '@/shared/clock/system-clock';
import { useRepositories } from '@/shared/storage/repositories-context';

import {
  dayEditFormFrom,
  previewDayEdit,
  type DayEditForm,
  type DayEditPreview,
} from '../day-edit-form';
import type { DayContext } from './use-day-context';

/** État et actions de l'éditeur d'un jour. */
export interface DayEditState {
  readonly form: DayEditForm;
  readonly update: (changes: Partial<DayEditForm>) => void;
  readonly preview: DayEditPreview;
  /** Enregistre le plan recalculé : il remplace le plan en cours. */
  readonly save: () => Promise<void>;
  readonly message: FormMessage | null;
}

/** Ce que l'éditeur reçoit de l'écran. */
export interface DayEditParams {
  readonly context: DayContext & { readonly plan: NonNullable<DayContext['plan']> };
  readonly date: CalendarDate;
  readonly planned: DayPlan;
  /** Appelé après l'enregistrement, pour recharger le plan. */
  readonly onSaved: () => void;
}

/**
 * Relie l'éditeur d'un jour au cas d'usage `DeclareDeviation` (aperçu recalculé à chaque saisie)
 * puis à `ValidatePlan` (enregistrement du plan recalculé).
 *
 * @param params - Données chargées, jour modifié et action après enregistrement
 * @returns L'état de l'éditeur
 */
export function useDayEdit({ context, date, planned, onSaved }: DayEditParams): DayEditState {
  const { plans } = useRepositories();
  const [form, setForm] = useState<DayEditForm>(() => dayEditFormFrom(planned));
  const [message, setMessage] = useState<FormMessage | null>(null);

  const preview = useMemo(
    () =>
      previewDayEdit({
        plan: context.plan,
        date,
        form,
        rules: context.rules,
        preferences: context.preferences,
      }),
    [context, date, form],
  );

  const save = useCallback(async () => {
    if (!preview.ok) {
      return;
    }
    await new ValidatePlan(plans, systemClock).execute(preview.outcome.plan);
    setMessage({ kind: 'success', text: 'Journée modifiée : la suite du plan est recalculée.' });
    onSaved();
  }, [preview, plans, onSaved]);

  return {
    form,
    update: (changes) => {
      setForm((current) => ({ ...current, ...changes }));
      setMessage(null);
    },
    preview,
    save,
    message,
  };
}
