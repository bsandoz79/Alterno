import { ChangeReminderSettings, ScheduleDepartureReminders } from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { systemClock } from '@/shared/clock/system-clock';
import type { FormMessage } from '@/shared/components/message-box';
import { useRepositories } from '@/shared/storage/repositories-context';

import { reminderConfirmation } from '../reminder-confirmation';
import { reminderOptionOf, reminderSettingsFor, type ReminderOption } from '../reminder-options';

/** État et actions du réglage du rappel de départ. */
export interface ReminderSettingsState {
  /** Option affichée (choisie mais pas forcément validée) ; `null` pendant le chargement. */
  readonly option: ReminderOption | null;
  /** Change l'option affichée, sans rien enregistrer. */
  readonly choose: (option: ReminderOption) => void;
  /** `true` si l'option affichée diffère du réglage enregistré. */
  readonly changed: boolean;
  /** Enregistre l'option choisie et reprogramme les rappels (cas d'usage `ChangeReminderSettings`). */
  readonly validate: () => Promise<void>;
  /** Confirmation après validation. */
  readonly message: FormMessage | null;
}

/**
 * Relie le réglage du rappel à son dépôt : l'utilisateur choisit un délai, puis le valide,
 * comme sur les autres écrans de l'app. Rechargé à chaque affichage de l'écran.
 *
 * @returns L'option choisie, son état et l'action de validation
 */
export function useReminderSettings(): ReminderSettingsState {
  const { reminders, plans, notifier } = useRepositories();
  const [saved, setSaved] = useState<ReminderOption | null>(null);
  const [option, setOption] = useState<ReminderOption | null>(null);
  const [message, setMessage] = useState<FormMessage | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void reminders.load().then((settings) => {
        if (active) {
          setSaved(reminderOptionOf(settings));
          setOption(reminderOptionOf(settings));
        }
      });
      return () => {
        active = false;
      };
    }, [reminders]),
  );

  const validate = useCallback(async () => {
    if (option === null) {
      return;
    }
    const scheduling = await new ChangeReminderSettings(
      reminders,
      new ScheduleDepartureReminders(plans, reminders, notifier, systemClock),
    ).execute(reminderSettingsFor(option));
    setSaved(option);
    setMessage(reminderConfirmation(option, scheduling));
  }, [option, reminders, plans, notifier]);

  return {
    option,
    choose: (next) => {
      setOption(next);
      setMessage(null);
    },
    changed: option !== saved,
    validate,
    message,
  };
}
