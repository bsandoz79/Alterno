import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../calendar/calendar-date';
import type { DatedPlan } from '../planning/dated-plan';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import { ReminderSettings } from './reminder-settings';
import { WeekCheckPlanner } from './week-check-planner';

const planner = new WeekCheckPlanner();
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);

/** Plan de test : une journée par date, avec son heure de départ. */
const planOf = (days: readonly (readonly [string, string])[]): DatedPlan => ({
  days: days.map(([iso, departure]) => ({
    date: date(iso),
    plan: {
      day: date(iso).weekday(),
      arrival: at('08:30'),
      lunchBreak: TimeSlot.between(at('12:00'), at('12:45')),
      departure: at(departure),
      worked: Duration.ofHours(7),
    },
  })),
  totalWorked: Duration.ofHours(7 * days.length),
});

const describeChecks = (
  plan: DatedPlan,
  today: string,
  now: string,
  settings = ReminderSettings.defaults(),
) =>
  planner
    .checksFor(plan, { today: date(today), now: at(now) }, settings)
    .map(
      (check) =>
        `${check.kind} ${check.date.toIsoString()} ${check.at.format()} (départ ${check.departure.format()})`,
    );

describe('WeekCheckPlanner — question de fin de semaine', () => {
  const week = planOf([
    ['2026-10-19', '16:30'],
    ['2026-10-20', '17:15'],
    ['2026-10-23', '15:30'],
  ]);

  it('demande le vendredi, 1h après le départ prévu, si la semaine s’est passée comme prévu', () => {
    expect(describeChecks(week, '2026-10-19', '09:00')).toEqual([
      'week-check 2026-10-23 16h30 (départ 15h30)',
    ]);
  });

  it('pose la question au dernier jour du plan dans la semaine (vendredi en récup)', () => {
    const recoveryFriday = planOf([
      ['2026-10-19', '17:00'],
      ['2026-10-22', '18:00'],
    ]);

    expect(describeChecks(recoveryFriday, '2026-10-19', '09:00')).toEqual([
      'week-check 2026-10-22 19h00 (départ 18h00)',
    ]);
  });

  it('pose une question par semaine quand le plan en couvre plusieurs', () => {
    const twoWeeks = planOf([
      ['2026-10-22', '17:00'],
      ['2026-10-23', '15:30'],
      ['2026-10-26', '17:00'],
      ['2026-10-27', '16:00'],
    ]);

    expect(describeChecks(twoWeeks, '2026-10-21', '09:00')).toEqual([
      'week-check 2026-10-23 16h30 (départ 15h30)',
      'week-check 2026-10-27 17h00 (départ 16h00)',
    ]);
  });

  it('ignore une question déjà passée', () => {
    expect(describeChecks(week, '2026-10-23', '16:30')).toEqual([]);
  });

  it('cas limite : la question du jour à la minute près est encore programmée', () => {
    expect(describeChecks(week, '2026-10-23', '16:29')).toHaveLength(1);
  });

  it('cas limite : un départ tardif pose la question à l’heure de départ, sans passer minuit', () => {
    const late = planOf([['2026-10-23', '23:30']]);

    expect(describeChecks(late, '2026-10-19', '09:00')).toEqual([
      'week-check 2026-10-23 23h30 (départ 23h30)',
    ]);
  });

  it('ne pose pas la question quand elle est désactivée', () => {
    const settings = ReminderSettings.create({
      departureLead: null,
      atDeparture: true,
      weekCheck: false,
    });

    expect(describeChecks(week, '2026-10-19', '09:00', settings)).toEqual([]);
  });

  it('ne pose pas de question sans jour planifié', () => {
    expect(describeChecks(planOf([]), '2026-10-19', '09:00')).toEqual([]);
  });
});
