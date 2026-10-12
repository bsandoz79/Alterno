import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { systemClock } from '@/shared/clock/system-clock';
import type { FormMessage } from '@/shared/components/message-box';
import { openDocument } from '@/shared/files/open-document';
import { pickDocument } from '@/shared/files/pick-document';
import type { AttachedCalendar } from '@/shared/storage/annual-calendar-store';
import { useRepositories } from '@/shared/storage/repositories-context';

import { checkAttachment } from '../attachment-rules';

/** État et actions de l'écran « Calendrier annuel ». */
export interface AnnualCalendarState {
  /** `undefined` pendant le chargement, `null` si aucun calendrier n'est joint. */
  readonly calendar: AttachedCalendar | null | undefined;
  readonly message: FormMessage | null;
  /** Ouvre le sélecteur, vérifie le fichier et l'enregistre (il remplace le précédent). */
  readonly attach: () => Promise<void>;
  readonly open: () => Promise<void>;
  readonly remove: () => Promise<void>;
}

/**
 * Relie l'écran au stockage du calendrier annuel : chargement à l'affichage, ajout, ouverture, suppression.
 *
 * @returns L'état de l'écran
 */
export function useAnnualCalendar(): AnnualCalendarState {
  const { annualCalendar } = useRepositories();
  const [calendar, setCalendar] = useState<AttachedCalendar | null | undefined>(undefined);
  const [message, setMessage] = useState<FormMessage | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void annualCalendar.load().then((loaded) => {
        if (active) {
          setCalendar(loaded);
        }
      });
      return () => {
        active = false;
      };
    }, [annualCalendar]),
  );

  const attach = useCallback(async () => {
    try {
      const picked = await pickDocument();
      if (picked === null) {
        return;
      }
      const refusal = checkAttachment(picked);
      if (refusal !== null) {
        setMessage({ kind: 'error', text: refusal });
        return;
      }
      setCalendar(await annualCalendar.attach(picked, systemClock.today()));
      setMessage({ kind: 'success', text: 'Calendrier joint : il reste consultable ici.' });
    } catch (error) {
      // Erreur du système (sélecteur, copie du fichier) : affichée plutôt que perdue.
      setMessage({ kind: 'error', text: `Impossible de joindre le fichier : ${describe(error)}` });
    }
  }, [annualCalendar]);

  const open = useCallback(async () => {
    if (calendar === null || calendar === undefined) {
      return;
    }
    try {
      await openDocument(calendar);
    } catch (error) {
      // Par exemple : aucune app du téléphone ne sait ouvrir ce type de fichier.
      setMessage({ kind: 'error', text: `Impossible d’ouvrir le fichier : ${describe(error)}` });
    }
  }, [calendar]);

  const remove = useCallback(async () => {
    await annualCalendar.remove();
    setCalendar(null);
    setMessage({ kind: 'info', text: 'Calendrier supprimé.' });
  }, [annualCalendar]);

  return { calendar, message, attach, open, remove };
}

/** Message lisible d'une erreur inattendue (le texte technique aide à diagnostiquer). */
function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
