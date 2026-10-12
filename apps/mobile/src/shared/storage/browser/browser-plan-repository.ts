import type { DatedPlan, PlanRepository } from '@alterno/engine';

import { fromDayRecords, toDayRecord, type DayRecord } from '../day-record';
import type { KeyValueStorage } from './key-value-storage';

const PLAN_KEY = 'alterno.plan';

/** Plan en cours (daté) stocké dans le navigateur, en JSON. Version web provisoire, avant l'API. */
export class BrowserPlanRepository implements PlanRepository {
  /**
   * @param storage - Stockage du navigateur (`localStorage` en production)
   */
  constructor(private readonly storage: KeyValueStorage) {}

  /** @inheritdoc */
  loadCurrent(): Promise<DatedPlan | null> {
    const stored = this.storage.getItem(PLAN_KEY);
    return Promise.resolve(
      stored === null ? null : fromDayRecords(JSON.parse(stored) as DayRecord[]),
    );
  }

  /** @inheritdoc */
  saveCurrent(plan: DatedPlan): Promise<void> {
    this.storage.setItem(PLAN_KEY, JSON.stringify(plan.days.map(toDayRecord)));
    return Promise.resolve();
  }
}
