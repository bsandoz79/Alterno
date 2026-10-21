import { Duration, ReminderSettings } from '@alterno/engine';

/** Délai du rappel avant le départ, en minutes ; 0 pour aucun rappel avant. */
export type ReminderOption = number;

/** Réglage en cours de saisie : délai du rappel avant, question à l'heure de départ et de fin de semaine. */
export interface ReminderDraft {
  readonly lead: ReminderOption;
  readonly atDeparture: boolean;
  readonly weekCheck: boolean;
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

/**
 * @param settings - Réglage enregistré
 * @returns Le réglage à afficher dans le formulaire
 */
export function reminderDraftOf(settings: ReminderSettings): ReminderDraft {
  return {
    lead: settings.departureLead?.toMinutes() ?? 0,
    atDeparture: settings.atDeparture,
    weekCheck: settings.weekCheck,
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
  });
}

/**
 * @returns `true` si les deux réglages sont identiques (rien à valider)
 */
export function sameReminderDraft(a: ReminderDraft, b: ReminderDraft): boolean {
  return a.lead === b.lead && a.atDeparture === b.atDeparture && a.weekCheck === b.weekCheck;
}
