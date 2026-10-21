import type { ReminderScheduling } from '@alterno/engine';

import type { FormMessage } from '@/shared/components/message-box';

import type { ReminderDraft } from './reminder-options';

/**
 * Message affiché après « Valider » : ce qui a été réglé, et si le téléphone
 * pourra vraiment afficher les notifications (sinon, comment y remédier).
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
  const parts = [
    ...(draft.lead === 0 ? [] : [`rappel ${String(draft.lead)} min avant le départ`]),
    ...(draft.atDeparture ? ['question à l’heure de départ'] : []),
    ...(draft.weekCheck ? ['question de fin de semaine'] : []),
  ];
  if (parts.length === 0) {
    return { kind: 'success', text: 'Notifications désactivées.' };
  }
  const { count } = scheduling;
  const scheduled =
    count === 0
      ? 'Aucun départ à venir dans ton plan pour l’instant.'
      : `${String(count)} ${count === 1 ? 'notification programmée' : 'notifications programmées'}.`;
  return { kind: 'success', text: `Réglé : ${enumerate(parts)}. ${scheduled}` };
}

/** Énumération à la française : « a », « a et b », « a, b et c ». */
function enumerate(parts: readonly string[]): string {
  const last = parts.at(-1) ?? '';
  return parts.length === 1 ? last : `${parts.slice(0, -1).join(', ')} et ${last}`;
}
