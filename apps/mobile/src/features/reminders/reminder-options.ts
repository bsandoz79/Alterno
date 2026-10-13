import { Duration, ReminderSettings } from '@alterno/engine';

/** Valeur d'une option : délai en minutes, 0 pour aucun rappel. */
export type ReminderOption = number;

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
 * @returns L'option à afficher comme choisie
 */
export function reminderOptionOf(settings: ReminderSettings): ReminderOption {
  return settings.departureLead?.toMinutes() ?? 0;
}

/**
 * @param option - Option choisie
 * @returns Le réglage correspondant
 */
export function reminderSettingsFor(option: ReminderOption): ReminderSettings {
  return option === 0
    ? ReminderSettings.disabled()
    : ReminderSettings.departureLead(Duration.ofMinutes(option));
}
