import type { ReminderScheduling } from '@alterno/engine';

import type { FormMessage } from '@/shared/components/message-box';

import type { ReminderDraft } from './reminder-options';

/**
 * Message affiché après « Valider » : combien de notifications sont programmées, et si le téléphone
 * pourra vraiment les afficher (sinon, comment y remédier).
 *
 * @param draft - Réglage validé
 * @param scheduling - Résultat de la reprogrammation
 * @returns Le message à afficher
 */
export function reminderConfirmation(
  draft: ReminderDraft,
  scheduling: ReminderScheduling,
): FormMessage {
  if (scheduling.delivery === 'not-allowed') {
    return {
      kind: 'error',
      text: 'Réglage enregistré, mais Android bloque les notifications d’Alterno : autorise-les dans Paramètres → Applications → Alterno → Notifications.',
    };
  }
  if (scheduling.delivery === 'unsupported') {
    return {
      kind: 'info',
      text: 'Réglage enregistré. Les notifications s’affichent dans l’application installée sur Android, pas dans Expo Go ni dans le navigateur.',
    };
  }
  const anyOn = draft.lead !== 0 || draft.atDeparture || draft.weekCheck || draft.approvalCheck;
  if (!anyOn) {
    return { kind: 'success', text: 'Notifications désactivées.' };
  }
  const { count } = scheduling;
  // Message court : le détail du réglage est déjà visible juste au-dessus.
  const scheduled =
    count === 0
      ? 'rien à venir pour l’instant'
      : `${String(count)} ${count === 1 ? 'notification programmée' : 'notifications programmées'}`;
  return { kind: 'success', text: `Enregistré · ${scheduled}.` };
}
