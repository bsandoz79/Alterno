import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../calendar/calendar-date';
import { SchoolWeeks } from '../calendar/school-weeks';
import type { DatedPlan } from '../planning/dated-plan';
import { PlanGenerator } from '../planning/plan-generator';
import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import { Duration } from '../time/duration';
import { DayArchiver } from './day-archiver';

const rules = laBrosseEtDupontRules();
const archiver = new DayArchiver(rules);
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);

/** Plan du lundi 19 au jeudi 22 octobre (38h), récup le vendredi 23. */
const plan: DatedPlan = (() => {
  const generated = new PlanGenerator(rules).planForTotalHours(
    ['monday', 'tuesday', 'wednesday', 'thursday'],
    Duration.ofHours(38),
  );
  return {
    days: generated.days.map((day, index) => ({
      date: date('2026-10-19').plusDays(index),
      plan: day,
    })),
    totalWorked: generated.totalWorked,
    recovery: { date: date('2026-10-23'), kind: 'full' },
  };
})();

const summary = (today: string, schoolWeeks = SchoolWeeks.none()): string[] =>
  archiver
    .elapsedDays(plan, date(today), schoolWeeks)
    .map(
      (day) =>
        `${day.date.toIsoString()} ${day.kind} ${day.worked.format()}/${day.expected.format()}`,
    );

describe('DayArchiver — journées passées à garder pour l’historique', () => {
  it('jeudi : lundi, mardi et mercredi sont passés, avec leurs heures prévues (plan suivi)', () => {
    expect(summary('2026-10-22')).toEqual([
      '2026-10-19 work 9h30/7h',
      '2026-10-20 work 9h30/7h',
      '2026-10-21 work 9h30/7h',
    ]);
  });

  it('garde les horaires des jours travaillés', () => {
    const [monday] = archiver.elapsedDays(plan, date('2026-10-20'), SchoolWeeks.none());

    expect(monday?.times?.arrival.format()).toBe('8h00');
  });

  it('le samedi, la récup du vendredi est archivée : 0h travaillées pour 7h attendues', () => {
    expect(summary('2026-10-24').at(-1)).toBe('2026-10-23 recovery 0h/7h');
  });

  it('une demi-journée de récup compte 3h30 travaillées pour 7h attendues', () => {
    const half = archiver.elapsedDays(
      { ...plan, recovery: { date: date('2026-10-23'), kind: 'half', part: 'afternoon' } },
      date('2026-10-24'),
      SchoolWeeks.none(),
    );

    expect(half.at(-1)?.kind).toBe('half-recovery');
    expect(half.at(-1)?.worked.format()).toBe('3h30');
  });

  it('archive les jours d’école de la période du plan (rien d’attendu)', () => {
    const schoolPlan: DatedPlan = {
      days: plan.days.slice(0, 1),
      totalWorked: Duration.ofHours(9, 30),
    };
    const days = archiver.elapsedDays(
      schoolPlan,
      date('2026-10-28'),
      SchoolWeeks.of([date('2026-10-26')]),
    );

    expect(days.map((day) => `${day.date.toIsoString()} ${day.kind}`)).toEqual([
      '2026-10-19 work',
      '2026-10-26 school',
      '2026-10-27 school',
    ]);
    expect(days.at(-1)?.expected.isZero()).toBe(true);
  });

  it('rien avant le premier jour du plan', () => {
    expect(summary('2026-10-19')).toEqual([]);
  });

  it('plan sans journée : rien à archiver, même en semaine d’école', () => {
    const empty: DatedPlan = { days: [], totalWorked: Duration.zero() };

    expect(
      archiver.elapsedDays(empty, date('2026-10-28'), SchoolWeeks.of([date('2026-10-26')])),
    ).toEqual([]);
  });

  it('range les jours d’école avant les jours travaillés qui les suivent', () => {
    const fromWednesday: DatedPlan = {
      days: plan.days.slice(2).map((entry) => entry),
      totalWorked: Duration.ofHours(19),
    };
    const days = archiver.elapsedDays(
      fromWednesday,
      date('2026-10-23'),
      SchoolWeeks.of([date('2026-10-19')]),
    );

    expect(days.map((day) => day.kind)).toEqual(['school', 'school', 'work', 'work']);
  });
});
