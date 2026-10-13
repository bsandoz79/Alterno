import { ReminderSettings, type ReminderSettingsRepository } from '@alterno/engine';

import {
  fromReminderSettingsRecord,
  toReminderSettingsRecord,
  type ReminderSettingsRecord,
} from '../reminder-settings-record';
import type { KeyValueStorage } from './key-value-storage';

const REMINDERS_KEY = 'alterno.reminders';

/** Réglage des rappels stocké dans le navigateur, en JSON. Version web provisoire, avant l'API. */
export class BrowserReminderSettingsRepository implements ReminderSettingsRepository {
  /**
   * @param storage - Stockage du navigateur (`localStorage` en production)
   */
  constructor(private readonly storage: KeyValueStorage) {}

  /** @inheritdoc */
  load(): Promise<ReminderSettings> {
    const stored = this.storage.getItem(REMINDERS_KEY);
    return Promise.resolve(
      stored === null
        ? ReminderSettings.defaults()
        : fromReminderSettingsRecord(JSON.parse(stored) as ReminderSettingsRecord),
    );
  }

  /** @inheritdoc */
  save(settings: ReminderSettings): Promise<void> {
    this.storage.setItem(REMINDERS_KEY, JSON.stringify(toReminderSettingsRecord(settings)));
    return Promise.resolve();
  }
}
