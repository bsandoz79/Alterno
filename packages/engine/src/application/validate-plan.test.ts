import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import { HoursCounter } from '../domain/counter/hours-counter';
import type { DatedPlan } from '../domain/planning/dated-plan';
import type { PlanRepository } from '../domain/ports/plan-repository';
import { laBrosseEtDupontRules } from '../domain/rules/presets/la-brosse-et-dupont';
import { Duration } from '../domain/time/duration';
import { SimulatePlan } from './simulate-plan';
import { ValidatePlan } from './validate-plan';

/** Dépôt en mémoire : un « faux » adaptateur, possible parce que le cas d'usage dépend d'une interface. */
const createMemoryPlanRepository = (): PlanRepository & { current: DatedPlan | null } => {
  const repository = {
    current: null as DatedPlan | null,
    loadCurrent: () => Promise.resolve(repository.current),
    saveCurrent: (plan: DatedPlan) => {
      repository.current = plan;
      return Promise.resolve();
    },
  };
  return repository;
};

const days = ['2026-10-19', '2026-10-20', '2026-10-21'].map((iso) =>
  CalendarDate.fromIsoString(iso),
);
const simulate = new SimulatePlan(laBrosseEtDupontRules());
const simulation = (hours: number): DatedPlan =>
  simulate.execute({
    days,
    objective: { kind: 'hours', target: Duration.ofHours(hours) },
    pace: 'steady',
    counter: HoursCounter.zero(),
  });

describe('ValidatePlan — valider un scénario', () => {
  it('enregistre la simulation comme plan en cours', async () => {
    const plans = createMemoryPlanRepository();
    await new ValidatePlan(plans).execute(simulation(24));

    expect(plans.current?.totalWorked.format()).toBe('24h');
    expect(plans.current?.days[0]?.date.toIsoString()).toBe('2026-10-19');
  });

  it('remplace le plan en cours précédent', async () => {
    const plans = createMemoryPlanRepository();
    const validate = new ValidatePlan(plans);
    await validate.execute(simulation(24));
    await validate.execute(simulation(21));

    expect(plans.current?.totalWorked.format()).toBe('21h');
  });
});
