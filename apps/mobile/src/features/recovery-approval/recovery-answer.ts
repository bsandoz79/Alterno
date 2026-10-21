import type { CalendarDate, RecoveryAnswer } from '@alterno/engine';

import type { FormMessage } from '@/shared/components/message-box';
import { formatShortDate } from '@/shared/format/format-date';

const ANSWERS: readonly RecoveryAnswer[] = ['approved', 'refused', 'not-yet'];

/**
 * Lit la réponse passée dans l'adresse (« /recup?answer=approved »), posée par un bouton de la
 * notification. Une valeur absente ou inconnue (adresse tapée à la main) est ignorée.
 *
 * @param value - Paramètre de route tel que fourni par Expo Router
 * @returns La réponse, ou `null`
 */
export function parseAnswerParam(value: unknown): RecoveryAnswer | null {
  return ANSWERS.find((answer) => answer === value) ?? null;
}

/**
 * Message affiché après la réponse.
 *
 * @param answer - Réponse donnée
 * @param recoveryDate - Jour de la récup
 * @returns Le message de confirmation
 */
export function answerConfirmation(
  answer: RecoveryAnswer,
  recoveryDate: CalendarDate,
): FormMessage {
  const day = formatShortDate(recoveryDate);
  switch (answer) {
    case 'approved':
      return { kind: 'success', text: `Récup du ${day} acceptée.` };
    case 'refused':
      return { kind: 'info', text: `Récup du ${day} refusée.` };
    case 'not-yet':
      return { kind: 'info', text: 'D’accord, on te redemandera.' };
  }
}
