import type { ReminderScheduling } from '@alterno/engine';

import type { FormMessage } from '@/shared/components/message-box';

import type { ReminderOption } from './reminder-options';

/**
 * Message affiché après « Valider le rappel » : ce qui a été réglé, et si le téléphone
 * pourra vraiment afficher les rappels (sinon, comment y remédier).
 *
 * @param option - Délai validé (0 : rappels désactivés)
 * @param scheduling - Résultat de la reprogrammation
 * @returns Le message à afficher
 */
export function reminderConfirmation(
  option: ReminderOption,
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
      text: 'Réglage enregistré. Les rappels s’affichent dans l’application installée sur Android, pas dans Expo Go ni dans le navigateur.',
    };
  }
  if (option === 0) {
    return { kind: 'success', text: 'Rappels désactivés.' };
  }
  const lead = `Rappel réglé : ${String(option)} min avant le départ`;
  const { count } = scheduling;
  return {
    kind: 'success',
    text:
      count === 0
        ? `${lead}. Aucun départ à venir dans ton plan pour l’instant.`
        : `${lead} — ${String(count)} ${count === 1 ? 'rappel programmé' : 'rappels programmés'}.`,
  };
}
