import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../calendar/calendar-date';
import { SchoolWeeks } from '../calendar/school-weeks';
import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import type { DatedPlan } from './dated-plan';
import { DefaultWeekPlanner } from './default-week-planner';

const planner = new DefaultWeekPlanner(laBrosseEtDupontRules());
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
const noSchool = SchoolWeeks.none();

/** Plan enregistré de test : 7h par jour aux dates données. */
const storedPlan = (isoDates: readonly string[], recovery?: DatedPlan['recovery']): DatedPlan => ({
  days: isoDates.map((iso) => ({
    date: date(iso),
    plan: {
      day: date(iso).weekday(),
      arrival: at('08:30'),
      lunchBreak: TimeSlot.between(at('12:00'), at('12:45')),
      departure: at('16:15'),
      worked: Duration.ofHours(7),
    },
  })),
  totalWorked: Duration.ofHours(7 * isoDates.length),
  ...(recovery === undefined ? {} : { recovery }),
});

const datesOf = (plan: DatedPlan | null): readonly string[] =>
  plan?.days.map((day) => day.date.toIsoString()) ?? [];

describe('DefaultWeekPlanner — plan par défaut quand aucun plan n’est validé', () => {
  it('sans plan, propose une semaine standard de 35h (7h × 5 jours), au rythme régulier', () => {
    const plan = planner.currentPlan(null, date('2026-10-21'), noSchool);

    expect(plan?.isDefault).toBe(true);
    expect(plan?.totalWorked.format()).toBe('35h');
    expect(datesOf(plan)).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
    ]);
    expect(plan?.days.every((day) => day.plan.worked.equals(Duration.ofHours(7)))).toBe(true);
  });

  it('un plan validé qui couvre la semaine est prioritaire', () => {
    const stored = storedPlan(['2026-10-22', '2026-10-23']);

    expect(planner.currentPlan(stored, date('2026-10-21'), noSchool)).toBe(stored);
  });

  it('un plan validé pour la semaine suivante reste prioritaire', () => {
    const stored = storedPlan(['2026-10-26', '2026-10-27']);

    expect(planner.currentPlan(stored, date('2026-10-21'), noSchool)).toBe(stored);
  });

  it('un plan terminé (semaines passées) laisse place à la semaine standard', () => {
    const stored = storedPlan(['2026-10-12', '2026-10-13']);

    expect(datesOf(planner.currentPlan(stored, date('2026-10-21'), noSchool))).toHaveLength(5);
  });

  it('cas limite : semaine d’école, pas de plan par défaut', () => {
    const school = SchoolWeeks.of([date('2026-10-19')]);

    expect(planner.currentPlan(null, date('2026-10-21'), school)).toBeNull();
  });

  it('cas limite : le week-end, la semaine standard est celle qui vient', () => {
    expect(datesOf(planner.currentPlan(null, date('2026-10-24'), noSchool))).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
    ]);
  });

  it('cas limite : le vendredi, la semaine en cours est encore la bonne', () => {
    expect(datesOf(planner.currentPlan(null, date('2026-10-23'), noSchool))[0]).toBe('2026-10-19');
  });

  it('cas limite : la récup prévue par le plan terminé n’est pas un jour à travailler', () => {
    const stored = storedPlan(['2026-10-15', '2026-10-16'], {
      date: date('2026-10-19'),
      kind: 'full',
    });
    const plan = planner.currentPlan(stored, date('2026-10-21'), noSchool);

    expect(datesOf(plan)).toEqual(['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23']);
    expect(plan?.totalWorked.format()).toBe('28h');
    expect(plan?.recovery).toBeUndefined();
  });
});
