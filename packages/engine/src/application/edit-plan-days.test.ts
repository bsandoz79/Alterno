import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import { HoursCounter } from '../domain/counter/hours-counter';
import { laBrosseEtDupontRules } from '../domain/rules/presets/la-brosse-et-dupont';
import { InvalidValueError } from '../domain/shared/domain-error';
import { Duration } from '../domain/time/duration';
import { TimeOfDay } from '../domain/time/time-of-day';
import { TimeSlot } from '../domain/time/time-slot';
import { EditPlanDays } from './edit-plan-days';
import type { FixedDay } from './simulate-plan';
import { SimulatePlan } from './simulate-plan';

const rules = laBrosseEtDupontRules();
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
const lunch = TimeSlot.between(at('12:15'), at('13:00'));
const edit = new EditPlanDays(rules);
const week = new SimulatePlan(rules).execute({
  days: ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'].map(date),
  objective: { kind: 'hours', target: Duration.ofHours(35) },
  pace: 'steady',
  counter: HoursCounter.zero(),
});
const day = (iso: string, arrival: string, departure: string): FixedDay => ({
  date: date(iso),
  arrival: at(arrival),
  lunchBreak: lunch,
  departure: at(departure),
});

describe('EditPlanDays — étirer des jours du plan dans la semaine', () => {
  it('jeudi étiré à 9h : le reste va sur les jours à venir, les jours passés ne bougent pas', () => {
    const edited = edit.execute({
      plan: week,
      today: date('2026-10-28'),
      fixedDays: [day('2026-10-29', '08:00', '17:45')],
    });

    expect(edited.days.map((entry) => entry.plan.worked.format())).toEqual([
      '7h',
      '7h',
      '6h',
      '9h',
      '6h',
    ]);
    expect(edited.days[0]).toEqual(week.days[0]);
    expect(edited.days[3]?.plan.departure.format()).toBe('17h45');
    expect(edited.totalWorked.format()).toBe('35h');
    expect(edited.isDefault).toBe(false);
  });

  it('refuse de modifier un jour passé', () => {
    expect(() =>
      edit.execute({
        plan: week,
        today: date('2026-10-28'),
        fixedDays: [day('2026-10-26', '08:00', '17:45')],
      }),
    ).toThrow(InvalidValueError);
  });

  it('dit ce qui manque quand les jours à venir ne suffisent plus', () => {
    expect(() =>
      edit.execute({
        plan: week,
        today: date('2026-10-30'),
        fixedDays: [day('2026-10-30', '09:00', '15:30')],
      }),
    ).toThrow(/il manque 1h15/);
  });

  it('garde la récup du plan', () => {
    const withRecovery = { ...week, recovery: { date: date('2026-10-30'), kind: 'full' as const } };
    const edited = edit.execute({
      plan: { ...withRecovery, days: withRecovery.days.slice(0, 4) },
      today: date('2026-10-26'),
      fixedDays: [day('2026-10-26', '08:00', '16:30')],
    });

    expect(edited.recovery?.date.toIsoString()).toBe('2026-10-30');
  });
});
