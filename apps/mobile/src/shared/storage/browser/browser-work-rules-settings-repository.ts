import type { WorkRulesSettings, WorkRulesSettingsRepository } from '@alterno/engine';

import {
  fromWorkRulesSettingsRecord,
  toWorkRulesSettingsRecord,
  type WorkRulesSettingsRecord,
} from '../work-rules-settings-record';
import type { KeyValueStorage } from './key-value-storage';

const WORK_RULES_KEY = 'alterno.workRules';

/** Réglages des règles horaires stockés dans le navigateur, en JSON. Version web provisoire, avant l'API. */
export class BrowserWorkRulesSettingsRepository implements WorkRulesSettingsRepository {
  /**
   * @param storage - Stockage du navigateur (`localStorage` en production)
   */
  constructor(private readonly storage: KeyValueStorage) {}

  /** @inheritdoc */
  load(): Promise<WorkRulesSettings | null> {
    const stored = this.storage.getItem(WORK_RULES_KEY);
    return Promise.resolve(
      stored === null
        ? null
        : fromWorkRulesSettingsRecord(JSON.parse(stored) as WorkRulesSettingsRecord),
    );
  }

  /** @inheritdoc */
  save(settings: WorkRulesSettings): Promise<void> {
    this.storage.setItem(WORK_RULES_KEY, JSON.stringify(toWorkRulesSettingsRecord(settings)));
    return Promise.resolve();
  }
}
