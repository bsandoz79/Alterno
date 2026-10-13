import { Duration, ReminderSettings } from '@alterno/engine';

/** Réglage des rappels sous forme de données brutes : délai en minutes, ou `null` si désactivé. */
export interface ReminderSettingsRecord {
  readonly departureLeadMinutes: number | null;
}

/**
 * Convertit le réglage en données brutes.
 *
 * @param settings - Réglage des rappels
 * @returns Ses données à enregistrer
 */
export function toReminderSettingsRecord(settings: ReminderSettings): ReminderSettingsRecord {
  return { departureLeadMinutes: settings.departureLead?.toMinutes() ?? null };
}

/**
 * Reconstruit le réglage à partir des données enregistrées.
 *
 * @param record - Données enregistrées
 * @returns Le réglage
 * @throws {InvalidValueError} Si le délai enregistré est hors limites (donnée corrompue)
 */
export function fromReminderSettingsRecord(record: ReminderSettingsRecord): ReminderSettings {
  return record.departureLeadMinutes === null
    ? ReminderSettings.disabled()
    : ReminderSettings.departureLead(Duration.ofMinutes(record.departureLeadMinutes));
}
