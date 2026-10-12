import type { PlanningPreferences, PlanningPreferencesRepository } from '@alterno/engine';

import {
  fromPlanningPreferencesRecord,
  toPlanningPreferencesRecord,
  type PlanningPreferencesRecord,
} from '../planning-preferences-record';
import type { KeyValueStorage } from './key-value-storage';

const PREFERENCES_KEY = 'alterno.preferences';

/** Préférences de planification stockées dans le navigateur, en JSON. Version web provisoire, avant l'API. */
export class BrowserPlanningPreferencesRepository implements PlanningPreferencesRepository {
  /**
   * @param storage - Stockage du navigateur (`localStorage` en production)
   */
  constructor(private readonly storage: KeyValueStorage) {}

  /** @inheritdoc */
  load(): Promise<PlanningPreferences> {
    const stored = this.storage.getItem(PREFERENCES_KEY);
    return Promise.resolve(
      stored === null
        ? {}
        : fromPlanningPreferencesRecord(JSON.parse(stored) as PlanningPreferencesRecord),
    );
  }

  /** @inheritdoc */
  save(preferences: PlanningPreferences): Promise<void> {
    this.storage.setItem(PREFERENCES_KEY, JSON.stringify(toPlanningPreferencesRecord(preferences)));
    return Promise.resolve();
  }
}
