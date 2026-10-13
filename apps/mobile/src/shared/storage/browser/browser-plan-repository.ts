import type { DatedPlan, PlanRepository } from '@alterno/engine';

import { fromDayRecords, toDayRecord, type DayRecord } from '../day-record';
import {
  toPlanRecoveryRecord,
  withPlanRecovery,
  type PlanRecoveryRecord,
} from '../plan-recovery-record';
import type { KeyValueStorage } from './key-value-storage';

const PLAN_KEY = 'alterno.plan';
// Clé à part : les plans déjà enregistrés (tableau de journées) restent lisibles tels quels.
const RECOVERY_KEY = 'alterno.plan.recovery';

/** Plan en cours (daté) stocké dans le navigateur, en JSON. Version web provisoire, avant l'API. */
export class BrowserPlanRepository implements PlanRepository {
  /**
   * @param storage - Stockage du navigateur (`localStorage` en production)
   */
  constructor(private readonly storage: KeyValueStorage) {}

  /** @inheritdoc */
  loadCurrent(): Promise<DatedPlan | null> {
    const stored = this.storage.getItem(PLAN_KEY);
    if (stored === null) {
      return Promise.resolve(null);
    }
    const recovery = this.storage.getItem(RECOVERY_KEY);
    return Promise.resolve(
      withPlanRecovery(
        fromDayRecords(JSON.parse(stored) as DayRecord[]),
        recovery === null ? null : (JSON.parse(recovery) as PlanRecoveryRecord),
      ),
    );
  }

  /** @inheritdoc */
  saveCurrent(plan: DatedPlan): Promise<void> {
    this.storage.setItem(PLAN_KEY, JSON.stringify(plan.days.map(toDayRecord)));
    if (plan.recovery === undefined) {
      this.storage.removeItem(RECOVERY_KEY);
    } else {
      this.storage.setItem(RECOVERY_KEY, JSON.stringify(toPlanRecoveryRecord(plan.recovery)));
    }
    return Promise.resolve();
  }
}
