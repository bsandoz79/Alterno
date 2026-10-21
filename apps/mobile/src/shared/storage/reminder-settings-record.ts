import { Duration, ReminderSettings } from '@alterno/engine';

/**
 * Réglage des rappels sous forme de données brutes : délai en minutes (`null` si désactivé),
 * question au départ et question de fin de semaine.
 */
export interface ReminderSettingsRecord {
  readonly departureLeadMinutes: number | null;
  /** Absent des réglages enregistrés avant ALT-48 : la question est alors activée, comme par défaut. */
  readonly atDeparture?: boolean | null;
  /** Absent des réglages enregistrés avant ALT-30 : la question est alors activée, comme par défaut. */
  readonly weekCheck?: boolean | null;
}

/**
 * Convertit le réglage en données brutes.
 *
 * @param settings - Réglage des rappels
 * @returns Ses données à enregistrer
 */
export function toReminderSettingsRecord(settings: ReminderSettings): ReminderSettingsRecord {
  return {
    departureLeadMinutes: settings.departureLead?.toMinutes() ?? null,
    atDeparture: settings.atDeparture,
    weekCheck: settings.weekCheck,
  };
}

/**
 * Reconstruit le réglage à partir des données enregistrées.
 *
 * @param record - Données enregistrées
 * @returns Le réglage
 * @throws {InvalidValueError} Si le délai enregistré est hors limites (donnée corrompue)
 */
export function fromReminderSettingsRecord(record: ReminderSettingsRecord): ReminderSettings {
  return ReminderSettings.create({
    departureLead:
      record.departureLeadMinutes === null ? null : Duration.ofMinutes(record.departureLeadMinutes),
    atDeparture: record.atDeparture ?? ReminderSettings.defaults().atDeparture,
    weekCheck: record.weekCheck ?? ReminderSettings.defaults().weekCheck,
  });
}
