import {
  CalendarDate,
  Duration,
  HoursCounter,
  SimulatePlan,
  laBrosseEtDupontRules,
  type DatedPlan,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { BrowserPlanRepository } from '../storage/browser/browser-plan-repository';
import { createMemoryStorage } from '../storage/testing/memory-storage';
import { ReschedulingPlanRepository } from './rescheduling-plan-repository';

const plan: DatedPlan = new SimulatePlan(laBrosseEtDupontRules()).execute({
  days: [CalendarDate.fromIsoString('2026-10-19')],
  objective: { kind: 'hours', target: Duration.ofHours(7) },
  pace: 'steady',
  counter: HoursCounter.zero(),
});

/** Compte les reprogrammations demandées. */
const counting = (): { calls: number; reschedule: () => Promise<void> } => {
  const spy = {
    calls: 0,
    reschedule: () => {
      spy.calls += 1;
      return Promise.resolve();
    },
  };
  return spy;
};

describe('Reprogrammation des rappels après un changement de plan', () => {
  it('reprogramme après l’enregistrement d’un plan, et relit le plan enregistré', async () => {
    const spy = counting();
    const plans = new ReschedulingPlanRepository(
      new BrowserPlanRepository(createMemoryStorage()),
      spy.reschedule,
    );

    await plans.saveCurrent(plan);

    expect(spy.calls).toBe(1);
    expect((await plans.loadCurrent())?.days).toHaveLength(1);
  });
});
