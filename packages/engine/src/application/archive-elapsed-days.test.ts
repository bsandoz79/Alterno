import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import { SchoolWeeks } from '../domain/calendar/school-weeks';
import type { ArchivedDay } from '../domain/history/archived-day';
import type { DatedPlan } from '../domain/planning/dated-plan';
import { PlanGenerator } from '../domain/planning/plan-generator';
import type { Clock } from '../domain/ports/clock';
import type { DayArchiveRepository } from '../domain/ports/day-archive-repository';
import type { PlanRepository } from '../domain/ports/plan-repository';
import { laBrosseEtDupontRules } from '../domain/rules/presets/la-brosse-et-dupont';
import { Duration } from '../domain/time/duration';
import { TimeOfDay } from '../domain/time/time-of-day';
import { ArchiveElapsedDays } from './archive-elapsed-days';
import { ArchivingPlanRepository } from './archiving-plan-repository';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const clockAt = (iso: string): Clock => ({
  today: () => date(iso),
  currentTime: () => TimeOfDay.of(9, 0),
});

/** Plan de `hours` sur les jours donnés (à partir du lundi 19 octobre). */
const planOf = (count: number, hours: number, first = '2026-10-19'): DatedPlan => {
  const weekdays = (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).slice(
    0,
    count,
  );
  const generated = new PlanGenerator(laBrosseEtDupontRules()).planForTotalHours(
    weekdays,
    Duration.ofHours(hours),
  );
  return {
    days: generated.days.map((day, index) => ({ date: date(first).plusDays(index), plan: day })),
    totalWorked: generated.totalWorked,
  };
};

const memoryPlans = (initial: DatedPlan | null): PlanRepository & { saved: DatedPlan | null } => {
  const repository = {
    saved: initial,
    loadCurrent: () => Promise.resolve(repository.saved),
    saveCurrent: (plan: DatedPlan) => {
      repository.saved = plan;
      return Promise.resolve();
    },
  };
  return repository;
};

const memoryArchive = (): DayArchiveRepository & { days: ArchivedDay[] } => {
  const archive = {
    days: [] as ArchivedDay[],
    loadAll: () => Promise.resolve(archive.days),
    save: (days: readonly ArchivedDay[]) => {
      archive.days = [
        ...archive.days.filter((kept) => !days.some((day) => day.date.equals(kept.date))),
        ...days,
      ];
      return Promise.resolve();
    },
  };
  return archive;
};

const sources = {
  workRules: { load: () => Promise.resolve(null), save: () => Promise.resolve() },
  schoolWeeks: { load: () => Promise.resolve(SchoolWeeks.none()), save: () => Promise.resolve() },
};

const isoDates = (days: readonly ArchivedDay[]): string[] =>
  days.map((day) => day.date.toIsoString()).sort();

describe('ArchiveElapsedDays — garder les journées passées', () => {
  it('archive les jours passés du plan en cours (mercredi : lundi et mardi)', async () => {
    const archive = memoryArchive();
    await new ArchiveElapsedDays(
      [memoryPlans(planOf(5, 35))],
      archive,
      sources,
      clockAt('2026-10-21'),
    ).execute();

    expect(isoDates(archive.days)).toEqual(['2026-10-19', '2026-10-20']);
  });

  it('une source ultérieure l’emporte sur la précédente pour une même date', async () => {
    const archive = memoryArchive();
    await new ArchiveElapsedDays(
      [memoryPlans(planOf(5, 35)), memoryPlans(planOf(5, 40))],
      archive,
      sources,
      clockAt('2026-10-20'),
    ).execute();

    expect(archive.days.map((day) => day.worked.format())).toEqual(['8h']);
  });

  it('sans plan, n’archive rien', async () => {
    const archive = memoryArchive();
    await new ArchiveElapsedDays(
      [memoryPlans(null)],
      archive,
      sources,
      clockAt('2026-10-21'),
    ).execute();

    expect(archive.days).toEqual([]);
  });
});

describe('ArchivingPlanRepository — un nouveau plan n’efface pas l’historique', () => {
  it('archive les jours passés de l’ancien plan avant de le remplacer', async () => {
    const archive = memoryArchive();
    const inner = memoryPlans(planOf(5, 35));
    const clock = clockAt('2026-10-22');
    const plans = new ArchivingPlanRepository(
      inner,
      new ArchiveElapsedDays([inner], archive, sources, clock),
    );

    await plans.saveCurrent(planOf(2, 14, '2026-10-22'));

    expect(isoDates(archive.days)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21']);
    expect(inner.saved?.days[0]?.date.toIsoString()).toBe('2026-10-22');
    expect((await plans.loadCurrent())?.days).toHaveLength(2);
  });
});
