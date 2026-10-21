import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import { SchoolWeeks } from '../domain/calendar/school-weeks';
import type { DatedPlan } from '../domain/planning/dated-plan';
import type { Clock } from '../domain/ports/clock';
import type { PlanRepository } from '../domain/ports/plan-repository';
import { laBrosseEtDupontSettings } from '../domain/rules/presets/la-brosse-et-dupont';
import type { WorkRulesSettings } from '../domain/rules/work-rules-settings';
import { Duration } from '../domain/time/duration';
import { TimeOfDay } from '../domain/time/time-of-day';
import { PlanWithDefaultWeek } from './plan-with-default-week';

const clock: Clock = {
  today: () => CalendarDate.fromIsoString('2026-10-21'),
  currentTime: () => TimeOfDay.of(9, 0),
};

/** Dépôt du plan en mémoire. */
const memoryPlans = (): PlanRepository & { saved: DatedPlan | null } => {
  const repository = {
    saved: null as DatedPlan | null,
    loadCurrent: () => Promise.resolve(repository.saved),
    saveCurrent: (plan: DatedPlan) => {
      repository.saved = plan;
      return Promise.resolve();
    },
  };
  return repository;
};

const withDefault = (
  inner: PlanRepository,
  settings: WorkRulesSettings | null = null,
  schoolWeeks = SchoolWeeks.none(),
) =>
  new PlanWithDefaultWeek(
    inner,
    {
      workRules: { load: () => Promise.resolve(settings), save: () => Promise.resolve() },
      preferences: { load: () => Promise.resolve({}), save: () => Promise.resolve() },
      schoolWeeks: { load: () => Promise.resolve(schoolWeeks), save: () => Promise.resolve() },
    },
    clock,
  );

describe('PlanWithDefaultWeek — plan en cours, ou semaine standard à défaut', () => {
  it('sans plan validé, donne la semaine standard selon les règles par défaut (35h)', async () => {
    const plan = await withDefault(memoryPlans()).loadCurrent();

    expect(plan?.isDefault).toBe(true);
    expect(plan?.totalWorked.format()).toBe('35h');
  });

  it('suit le temps attendu réglé par l’utilisateur (7h30 × 5 = 37h30)', async () => {
    const settings = { ...laBrosseEtDupontSettings(), expectedDailyWork: Duration.ofHours(7, 30) };
    const plan = await withDefault(memoryPlans(), settings).loadCurrent();

    expect(plan?.totalWorked.format()).toBe('37h30');
  });

  it('ne propose rien en semaine d’école', async () => {
    const school = SchoolWeeks.of([CalendarDate.fromIsoString('2026-10-19')]);

    await expect(withDefault(memoryPlans(), null, school).loadCurrent()).resolves.toBeNull();
  });

  it('n’enregistre rien en lisant, puis enregistre le plan comme un plan validé', async () => {
    const inner = memoryPlans();
    const plans = withDefault(inner);
    const plan = await plans.loadCurrent();

    expect(inner.saved).toBeNull();

    // Un écart déclaré sur la semaine standard l'enregistre : elle devient le plan en cours.
    if (plan !== null) {
      await plans.saveCurrent(plan);
    }

    expect(inner.saved?.isDefault).toBe(false);
    expect(inner.saved?.days).toHaveLength(5);
    expect((await plans.loadCurrent())?.isDefault).toBe(false);
  });
});
