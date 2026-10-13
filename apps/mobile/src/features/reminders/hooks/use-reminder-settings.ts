import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useRepositories } from '@/shared/storage/repositories-context';

import { reminderOptionOf, reminderSettingsFor, type ReminderOption } from '../reminder-options';

/** État et action du réglage du rappel de départ. */
export interface ReminderSettingsState {
  /** Option choisie ; `null` pendant le chargement. */
  readonly option: ReminderOption | null;
  /** Enregistre le nouveau choix (les rappels sont reprogrammés par le dépôt). */
  readonly choose: (option: ReminderOption) => Promise<void>;
}

/**
 * Relie le réglage du rappel à son dépôt. Rechargé à chaque affichage de l'écran.
 *
 * @returns L'option choisie et l'action pour la changer
 */
export function useReminderSettings(): ReminderSettingsState {
  const { reminders } = useRepositories();
  const [option, setOption] = useState<ReminderOption | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void reminders.load().then((settings) => {
        if (active) {
          setOption(reminderOptionOf(settings));
        }
      });
      return () => {
        active = false;
      };
    }, [reminders]),
  );

  const choose = useCallback(
    async (next: ReminderOption) => {
      setOption(next);
      await reminders.save(reminderSettingsFor(next));
    },
    [reminders],
  );

  return { option, choose };
}
