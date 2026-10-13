import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import { HoursCounter } from '../domain/counter/hours-counter';
import type { DatedDay, DatedPlan } from '../domain/planning/dated-plan';
import { laBrosseEtDupontRules } from '../domain/rules/presets/la-brosse-et-dupont';
import { InvalidValueError } from '../domain/shared/domain-error';
import { Duration } from '../domain/time/duration';
import { TimeOfDay } from '../domain/time/time-of-day';
import { DeclareDeviation } from './declare-deviation';
import { SimulatePlan } from './simulate-plan';

const rules = laBrosseEtDupontRules();
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
const declare = new DeclareDeviation(rules);

/** Plan validé sur les jours donnés, au rythme régulier. */
const planFor = (isoDays: readonly string[], hours: number): DatedPlan =>
  new SimulatePlan(rules).execute({
    days: isoDays.map(date),
    objective: { kind: 'hours', target: Duration.ofHours(hours) },
    pace: 'steady',
    counter: HoursCounter.zero(),
  });

/** Première journée d'un plan de test. */
const firstDayOf = (plan: DatedPlan): DatedDay => {
  const [first] = plan.days;
  if (first === undefined) {
    throw new Error('Plan de test vide');
  }
  return first;
};

const week = planFor(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'], 41);
const monday = firstDayOf(week);

describe('DeclareDeviation — modifier un jour du plan et recalculer la suite', () => {
  it('parti 50 min plus tôt lundi : le manque est réparti sur les jours suivants, dates conservées', () => {
    const outcome = declare.execute({
      plan: week,
      date: date('2026-10-19'),
      actual: { ...monday.plan, departure: at('16:07') },
      pace: 'steady',
    });

    expect(outcome.gap.format({ signed: true })).toBe('-0h50');
    expect(outcome.plan.days.map((day) => day.date.toIsoString())).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
    ]);
    expect(outcome.plan.days.map((day) => day.plan.worked.format())).toEqual([
      '7h22',
      '8h25',
      '8h25',
      '8h24',
      '8h24',
    ]);
    expect(outcome.plan.totalWorked.equals(Duration.ofHours(41))).toBe(true);
  });

  it('applique le rythme choisi à l’écran (rapide : le rattrapage se fait d’abord)', () => {
    const outcome = declare.execute({
      plan: week,
      date: date('2026-10-19'),
      actual: { ...monday.plan, departure: at('16:07') },
      pace: 'fast',
    });

    expect(outcome.plan.days.slice(1).map((day) => day.plan.worked.format())).toEqual([
      '10h',
      '9h38',
      '7h',
      '7h',
    ]);
  });

  it('répartit le rattrapage sur toute la période restante, semaines suivantes comprises', () => {
    const twoWeeks = planFor(
      [
        '2026-10-19',
        '2026-10-20',
        '2026-10-21',
        '2026-10-22',
        '2026-10-23',
        '2026-10-26',
        '2026-10-27',
        '2026-10-28',
        '2026-10-29',
        '2026-10-30',
      ],
      82,
    );
    const firstDay = firstDayOf(twoWeeks);
    const outcome = declare.execute({
      plan: twoWeeks,
      date: date('2026-10-19'),
      // Départ prévu à 16h57 (8h12 par jour) : parti 1h30 plus tôt.
      actual: { ...firstDay.plan, departure: at('15:27') },
      pace: 'steady',
    });

    expect(outcome.plan.days.at(-1)?.date.toIsoString()).toBe('2026-10-30');
    expect(outcome.plan.days.at(-1)?.plan.worked.isGreaterThan(firstDay.plan.worked)).toBe(true);
    expect(outcome.plan.totalWorked.equals(Duration.ofHours(82))).toBe(true);
  });

  it('transmet les alertes du recalcul (écart du jour)', () => {
    const outcome = declare.execute({
      plan: week,
      date: date('2026-10-19'),
      actual: { ...monday.plan, departure: at('16:07') },
      pace: 'steady',
    });

    expect(outcome.alerts).toEqual([
      { kind: 'day-gap', message: '-0h50 par rapport au plan le lundi.' },
    ]);
  });

  it('refuse un jour qui n’est pas dans le plan', () => {
    expect(() =>
      declare.execute({
        plan: week,
        date: date('2026-10-26'),
        actual: monday.plan,
        pace: 'steady',
      }),
    ).toThrow(InvalidValueError);
  });

  it('conserve la récup prévue par le plan', () => {
    const withRecovery = new SimulatePlan(rules).execute({
      days: ['2026-10-19', '2026-10-20', '2026-10-21'].map(date),
      objective: { kind: 'recovery', date: date('2026-10-21'), recovery: 'full' },
      pace: 'steady',
      counter: HoursCounter.zero(),
    });
    const outcome = declare.execute({
      plan: withRecovery,
      date: date('2026-10-19'),
      actual: { ...firstDayOf(withRecovery).plan, departure: at('17:00') },
      pace: 'steady',
    });

    expect(outcome.plan.recovery?.date.toIsoString()).toBe('2026-10-21');
    expect(outcome.plan.recovery?.kind).toBe('full');
  });
});
