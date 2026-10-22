import { describe, expect, it } from 'vitest';

import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import type { Weekday } from '../rules/weekday';
import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import type { WorkedDayInput } from '../worked-time/worked-time-calculator';
import { FixedDaysPlanner } from './fixed-days-planner';
import { ImpossiblePlanError } from './impossible-plan-error';
import { SteadyPace } from './pace/steady-pace';

const rules = laBrosseEtDupontRules();
const planner = new FixedDaysPlanner(rules);
const WEEK: readonly Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
const lunch = TimeSlot.between(at('12:15'), at('13:00'));
const times = (arrival: string, departure: string): WorkedDayInput => ({
  arrival: at(arrival),
  lunchBreak: lunch,
  departure: at(departure),
});

describe('FixedDaysPlanner — jours aux horaires choisis, le reste réparti', () => {
  it('lundi étiré de 8h00 à 17h45 (9h) : les 26h restantes vont sur les 4 autres jours', () => {
    const plan = planner.plan(
      WEEK,
      Duration.ofHours(35),
      new SteadyPace(),
      new Map([[0, times('08:00', '17:45')]]),
    );

    expect(plan.days[0]?.arrival.format()).toBe('8h00');
    expect(plan.days[0]?.departure.format()).toBe('17h45');
    expect(plan.days.map((day) => day.worked.format())).toEqual([
      '9h',
      '6h30',
      '6h30',
      '6h30',
      '6h30',
    ]);
    expect(plan.totalWorked.format()).toBe('35h');
  });

  it('garde les horaires choisis à la minute près (8h17 – 16h03)', () => {
    const plan = planner.plan(
      WEEK,
      Duration.ofHours(35),
      new SteadyPace(),
      new Map([[2, times('08:17', '16:03')]]),
    );

    expect(plan.days[2]?.arrival.format()).toBe('8h17');
    expect(plan.days[2]?.departure.format()).toBe('16h03');
    expect(plan.days[2]?.worked.format()).toBe('7h01');
  });

  it('refuse des horaires qui enfreignent une règle (arrivée après 9h00)', () => {
    const late = (): unknown =>
      planner.plan(
        WEEK,
        Duration.ofHours(35),
        new SteadyPace(),
        new Map([[0, times('09:30', '17:00')]]),
      );

    expect(late).toThrow(InvalidValueError);
    expect(late).toThrow(/lundi/);
  });

  it('dit ce qui manque quand les autres jours ne suffisent plus', () => {
    const short = new Map([
      [0, times('09:00', '16:00')],
      [1, times('09:00', '16:00')],
      [2, times('09:00', '16:00')],
      [3, times('09:00', '16:00')],
    ]);

    expect(() => planner.plan(WEEK, Duration.ofHours(35), new SteadyPace(), short)).toThrow(
      ImpossiblePlanError,
    );
  });

  it('sans jour choisi, se comporte comme le générateur', () => {
    const plan = planner.plan(WEEK, Duration.ofHours(35), new SteadyPace(), new Map());

    expect(plan.days.every((day) => day.worked.format() === '7h')).toBe(true);
  });

  it('refuse un jour choisi hors de la période', () => {
    expect(() =>
      planner.plan(
        WEEK,
        Duration.ofHours(35),
        new SteadyPace(),
        new Map([[7, times('08:00', '16:00')]]),
      ),
    ).toThrow(InvalidValueError);
  });
});
