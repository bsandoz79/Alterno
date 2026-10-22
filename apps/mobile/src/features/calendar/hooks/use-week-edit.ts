import {
  ValidatePlan,
  buildWorkRules,
  laBrosseEtDupontSettings,
  type CalendarDate,
  type DatedPlan,
  type PlanningPreferences,
  type WorkRules,
  type WorkedDayInput,
} from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { systemClock } from '@/shared/clock/system-clock';
import { setDayTimes, unlockDay, type EditedDays } from '@/shared/planning/edited-days';
import { useRepositories } from '@/shared/storage/repositories-context';

import { previewWeekEdit, type WeekEditPreview } from '../week-edit';

/** Règles et préférences nécessaires pour recalculer la semaine. */
interface EditContext {
  readonly rules: WorkRules;
  readonly preferences: PlanningPreferences;
}

/** État et actions du mode « Modifier » de la semaine. */
export interface WeekEditState {
  /** `true` une fois « Modifier » touché : les blocs à venir s'étirent. */
  readonly active: boolean;
  /** Règles en vigueur (`null` pendant le chargement). */
  readonly rules: WorkRules | null;
  readonly edits: EditedDays;
  /** Recalcul avec les jours étirés. */
  readonly preview: WeekEditPreview;
  /** Plan à dessiner : le recalcul, ou le dernier qui tenait si le recalcul échoue. */
  readonly shown: DatedPlan;
  readonly start: () => void;
  readonly change: (date: CalendarDate, times: WorkedDayInput) => void;
  /** Annule la dernière modification, `null` s'il n'y a rien à annuler. */
  readonly undo: (() => void) | null;
  /** Débloque les jours étirés : ils sont de nouveau répartis. */
  readonly unlockAll: () => void;
  readonly unlock: (date: CalendarDate) => void;
  /** Enregistre le plan recalculé et quitte le mode modification. */
  readonly save: () => Promise<void>;
  /** Quitte le mode modification sans rien enregistrer. */
  readonly cancel: () => void;
}

/**
 * Mode « Modifier » de l'écran Semaine : il faut le demander (bouton), pour ne pas étirer un bloc
 * par erreur en faisant défiler. Chaque bloc étiré devient un jour aux horaires choisis ; le reste
 * du plan est réparti sur les jours à venir (cas d'usage `EditPlanDays`), puis enregistré par `ValidatePlan`.
 *
 * @param plan - Plan en cours
 * @param today - Date du jour
 * @param onSaved - Appelé après l'enregistrement, pour recharger le plan
 * @returns L'état et les actions
 */
export function useWeekEdit(
  plan: DatedPlan,
  today: CalendarDate,
  onSaved: () => void,
): WeekEditState {
  const { workRules, preferences, plans } = useRepositories();
  const [context, setContext] = useState<EditContext | null>(null);
  const [active, setActive] = useState(false);
  const [edits, setEdits] = useState<EditedDays>({});
  const [previousEdits, setPreviousEdits] = useState<EditedDays | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([workRules.load(), preferences.load()]).then(([settings, saved]) => {
        if (active) {
          setContext({
            rules: buildWorkRules(settings ?? laBrosseEtDupontSettings()),
            preferences: saved,
          });
        }
      });
      return () => {
        active = false;
      };
    }, [workRules, preferences]),
  );

  const preview = useMemo<WeekEditPreview>(
    () =>
      context === null ? { ok: true, plan } : previewWeekEdit({ plan, today, edits, ...context }),
    [context, plan, today, edits],
  );
  const lastGood = useMemo<DatedPlan>(() => {
    if (context === null || previousEdits === null) {
      return plan;
    }
    const previous = previewWeekEdit({ plan, today, edits: previousEdits, ...context });
    return previous.ok ? previous.plan : plan;
  }, [context, plan, today, previousEdits]);

  const changeEdits = (next: EditedDays): void => {
    setPreviousEdits(edits);
    setEdits(next);
  };
  const reset = (): void => {
    setActive(false);
    setEdits({});
    setPreviousEdits(null);
  };

  return {
    active,
    rules: context?.rules ?? null,
    edits,
    preview,
    shown: preview.ok ? preview.plan : lastGood,
    start: () => {
      setActive(true);
    },
    change: (date, times) => {
      changeEdits(setDayTimes(edits, date, times));
    },
    undo:
      previousEdits === null
        ? null
        : () => {
            setEdits(previousEdits);
            setPreviousEdits(null);
          },
    unlockAll: () => {
      changeEdits({});
    },
    unlock: (date) => {
      changeEdits(unlockDay(edits, date));
    },
    save: async () => {
      if (preview.ok && Object.keys(edits).length > 0) {
        await new ValidatePlan(plans, systemClock).execute(preview.plan);
        onSaved();
      }
      reset();
    },
    cancel: reset,
  };
}
