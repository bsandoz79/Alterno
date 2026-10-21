import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import { SchoolWeeks } from '../domain/calendar/school-weeks';
import { HoursCounter } from '../domain/counter/hours-counter';
import type { DatedPlan } from '../domain/planning/dated-plan';
import type { Clock } from '../domain/ports/clock';
import type { PlanRepository } from '../domain/ports/plan-repository';
import { laBrosseEtDupontRules } from '../domain/rules/presets/la-brosse-et-dupont';
import { TimeOfDay } from '../domain/time/time-of-day';
import { CancelPlan, CancelRecovery } from './cancel-plan';
import { SimulatePlan } from './simulate-plan';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const rules = laBrosseEtDupontRules();
const clock: Clock = { today: () => date('2026-10-21'), currentTime: () => TimeOfDay.of(9, 0) };

/** Plan du lundi au jeudi qui prépare une récup le vendredi 23. */
const recoveryPlan: DatedPlan = new SimulatePlan(rules).execute({
  days: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'].map(date),
  objective: { kind: 'recovery', date: date('2026-10-23'), recovery: 'full' },
  pace: 'steady',
  counter: HoursCounter.zero(),
});

const memoryPlans = (plan: DatedPlan | null): PlanRepository & { current: DatedPlan | null } => {
  const repository = {
    current: plan,
    loadCurrent: () => Promise.resolve(repository.current),
    saveCurrent: (saved: DatedPlan) => {
      repository.current = saved;
      return Promise.resolve();
    },
  };
  return repository;
};

describe('CancelPlan — annuler le plan à partir d’aujourd’hui', () => {
  it('enregistre le plan annulé : jours passés gardés, journées standard, plus de récup', async () => {
    const plans = memoryPlans(recoveryPlan);
    await new CancelPlan(plans, rules, {}, clock).execute(recoveryPlan, SchoolWeeks.none());

    expect(plans.current?.recovery).toBeUndefined();
    expect(plans.current?.days.map((day) => day.date.toIsoString())).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
    ]);
    expect(plans.current?.days[2]?.plan.worked.format()).toBe('7h');
  });

  it('après un écart qui rend le plan irréalisable : annule à partir du lendemain', async () => {
    const plans = memoryPlans(recoveryPlan);
    await new CancelPlan(plans, rules, {}, clock).execute(
      recoveryPlan,
      SchoolWeeks.none(),
      date('2026-10-22'),
    );

    // Le mercredi (jour de l'écart) garde ses horaires ; jeudi et vendredi repassent à 7h.
    expect(
      plans.current?.days[2]?.plan.worked.equals(
        recoveryPlan.days[2]?.plan.worked ?? rules.expectedDailyWork,
      ),
    ).toBe(true);
    expect(plans.current?.days.slice(3).map((day) => day.plan.worked.format())).toEqual([
      '7h',
      '7h',
    ]);
  });
});

describe('CancelRecovery — annuler seulement la récup', () => {
  it('enregistre le plan sans récup, le jour de récup redevient travaillé', async () => {
    const plans = memoryPlans(recoveryPlan);
    const plan = await new CancelRecovery(plans, rules, {}, clock).execute();

    expect(plan?.recovery).toBeUndefined();
    expect(plans.current?.days.at(-1)?.date.toIsoString()).toBe('2026-10-23');
  });

  it('sans plan ou sans récup, il n’y a rien à annuler', async () => {
    await expect(
      new CancelRecovery(memoryPlans(null), rules, {}, clock).execute(),
    ).resolves.toBeNull();
    const withoutRecovery = memoryPlans({
      days: recoveryPlan.days,
      totalWorked: recoveryPlan.totalWorked,
    });
    await expect(
      new CancelRecovery(withoutRecovery, rules, {}, clock).execute(),
    ).resolves.toBeNull();
  });
});
