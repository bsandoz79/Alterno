import { ChangeReminderSettings, ScheduleDepartureReminders } from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { systemClock } from '@/shared/clock/system-clock';
import type { FormMessage } from '@/shared/components/message-box';
import { useRepositories } from '@/shared/storage/repositories-context';

import { reminderConfirmation } from '../reminder-confirmation';
import {
  reminderDraftOf,
  reminderSettingsFor,
  sameReminderDraft,
  type ReminderDraft,
} from '../reminder-options';

/** État et actions du réglage des notifications de départ. */
export interface ReminderSettingsState {
  /** Réglage affiché (saisi mais pas forcément validé) ; `null` pendant le chargement. */
  readonly draft: ReminderDraft | null;
  /** Modifie le réglage affiché, sans rien enregistrer. */
  readonly change: (changes: Partial<ReminderDraft>) => void;
  /** `true` si le réglage affiché diffère du réglage enregistré. */
  readonly changed: boolean;
  /** Enregistre le réglage affiché et reprogramme les rappels (cas d'usage `ChangeReminderSettings`). */
  readonly validate: () => Promise<void>;
  /** Confirmation après validation. */
  readonly message: FormMessage | null;
}

/**
 * Relie le réglage des notifications de départ à son dépôt : l'utilisateur le modifie, puis le valide,
 * comme sur les autres écrans de l'app. Rechargé à chaque affichage de l'écran.
 *
 * @returns Le réglage affiché, son état et l'action de validation
 */
export function useReminderSettings(): ReminderSettingsState {
  const { reminders, plans, notifier } = useRepositories();
  const [saved, setSaved] = useState<ReminderDraft | null>(null);
  const [draft, setDraft] = useState<ReminderDraft | null>(null);
  const [message, setMessage] = useState<FormMessage | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void reminders.load().then((settings) => {
        if (active) {
          setSaved(reminderDraftOf(settings));
          setDraft(reminderDraftOf(settings));
        }
      });
      return () => {
        active = false;
      };
    }, [reminders]),
  );

  const validate = useCallback(async () => {
    if (draft === null) {
      return;
    }
    const scheduling = await new ChangeReminderSettings(
      reminders,
      new ScheduleDepartureReminders(plans, reminders, notifier, systemClock),
    ).execute(reminderSettingsFor(draft));
    setSaved(draft);
    setMessage(reminderConfirmation(draft, scheduling));
  }, [draft, reminders, plans, notifier]);

  return {
    draft,
    change: (changes) => {
      setDraft((current) => (current === null ? current : { ...current, ...changes }));
      setMessage(null);
    },
    changed: draft !== null && (saved === null || !sameReminderDraft(draft, saved)),
    validate,
    message,
  };
}
