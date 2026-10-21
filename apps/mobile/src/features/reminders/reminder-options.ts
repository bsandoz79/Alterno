import { Duration, ReminderSettings } from '@alterno/engine';

/** Délai du rappel avant le départ, en minutes ; 0 pour aucun rappel avant. */
export type ReminderOption = number;

/**
 * Réglage en cours de saisie : délai du rappel avant, question à l'heure de départ,
 * question de fin de semaine, et suivi de la demande de récup (délais en jours).
 */
export interface ReminderDraft {
  readonly lead: ReminderOption;
  readonly atDeparture: boolean;
  readonly weekCheck: boolean;
  readonly approvalCheck: boolean;
  readonly approvalFirstDelayDays: number;
  readonly approvalRepeatDays: number;
}

/** Délais proposés à l'écran (peu de choix, pour tenir sur une ligne). */
export const REMINDER_OPTIONS: readonly {
  readonly value: ReminderOption;
  readonly label: string;
}[] = [
  { value: 0, label: 'Aucun' },
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
];

/** Délais proposés avant la première question de suivi de la récup. */
export const APPROVAL_FIRST_DELAY_OPTIONS: readonly {
  readonly value: number;
  readonly label: string;
}[] = [
  { value: 1, label: '24h' },
  { value: 2, label: '48h' },
  { value: 3, label: '72h' },
];

/** Intervalles proposés entre deux relances sans réponse. */
export const APPROVAL_REPEAT_OPTIONS: readonly {
  readonly value: number;
  readonly label: string;
}[] = [
  { value: 1, label: 'Chaque jour' },
  { value: 2, label: 'Tous les 2 jours' },
];

/**
 * @param settings - Réglage enregistré
 * @returns Le réglage à afficher dans le formulaire
 */
export function reminderDraftOf(settings: ReminderSettings): ReminderDraft {
  return {
    lead: settings.departureLead?.toMinutes() ?? 0,
    atDeparture: settings.atDeparture,
    weekCheck: settings.weekCheck,
    approvalCheck: settings.approvalCheck,
    approvalFirstDelayDays: settings.approvalFirstDelayDays,
    approvalRepeatDays: settings.approvalRepeatDays,
  };
}

/**
 * @param draft - Réglage saisi
 * @returns Le réglage correspondant
 */
export function reminderSettingsFor(draft: ReminderDraft): ReminderSettings {
  return ReminderSettings.create({
    departureLead: draft.lead === 0 ? null : Duration.ofMinutes(draft.lead),
    atDeparture: draft.atDeparture,
    weekCheck: draft.weekCheck,
    approvalCheck: draft.approvalCheck,
    approvalFirstDelayDays: draft.approvalFirstDelayDays,
    approvalRepeatDays: draft.approvalRepeatDays,
  });
}

/**
 * @returns `true` si les deux réglages sont identiques (rien à valider)
 */
export function sameReminderDraft(a: ReminderDraft, b: ReminderDraft): boolean {
  return (
    a.lead === b.lead &&
    a.atDeparture === b.atDeparture &&
    a.weekCheck === b.weekCheck &&
    a.approvalCheck === b.approvalCheck &&
    a.approvalFirstDelayDays === b.approvalFirstDelayDays &&
    a.approvalRepeatDays === b.approvalRepeatDays
  );
}
