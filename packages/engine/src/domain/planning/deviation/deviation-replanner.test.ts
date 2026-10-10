import { describe, expect, it } from 'vitest';

import { laBrosseEtDupontRules } from '../../rules/presets/la-brosse-et-dupont';
import type { Weekday } from '../../rules/weekday';
import { InvalidValueError } from '../../shared/domain-error';
import { Duration } from '../../time/duration';
import { TimeOfDay } from '../../time/time-of-day';
import { TimeSlot } from '../../time/time-slot';
import type { WorkedDayInput } from '../../worked-time/worked-time-calculator';
import { FastPace } from '../pace/fast-pace';
import type { DayPlan } from '../plan';
import { PlanGenerator } from '../plan-generator';
import { DeviationReplanner } from './deviation-replanner';

const rules = laBrosseEtDupontRules();
const generator = new PlanGenerator(rules);
const replanner = new DeviationReplanner(rules);

const WEEK: readonly Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const h = (hours: number, minutes = 0): Duration => Duration.ofHours(hours, minutes);
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);

/** Journée réelle : le plan du jour, avec les horaires modifiés. */
const actually = (
  planned: DayPlan | undefined,
  changes: Partial<WorkedDayInput>,
): WorkedDayInput => {
  if (planned === undefined) {
    throw new Error('Jour absent du plan de test');
  }
  return { ...planned, ...changes };
};

describe('DeviationReplanner — écart déclaré', () => {
  const plan41 = generator.planForTotalHours(WEEK, h(41));

  describe('recalcul des jours restants', () => {
    it('parti 50 min plus tôt lundi : le manque est réparti de mardi à vendredi', () => {
      const outcome = replanner.replan(
        plan41,
        0,
        actually(plan41.days[0], { departure: at('16:07') }),
      );

      expect(outcome.gap.format({ signed: true })).toBe('-0h50');
      expect(outcome.plan.days[0]?.worked.format()).toBe('7h22');
      expect(outcome.plan.days[0]?.departure.format()).toBe('16h07');
      expect(outcome.plan.days.slice(1).map((day) => day.worked.format())).toEqual([
        '8h25',
        '8h25',
        '8h24',
        '8h24',
      ]);
      expect(outcome.plan.totalWorked.equals(h(41))).toBe(true);
    });

    it('applique le rythme choisi au recalcul (rapide : mardi 10h, mercredi 9h38)', () => {
      const outcome = replanner.replan(
        plan41,
        0,
        actually(plan41.days[0], { departure: at('16:07') }),
        new FastPace(),
      );

      expect(outcome.plan.days.slice(1).map((day) => day.worked.format())).toEqual([
        '10h',
        '9h38',
        '7h',
        '7h',
      ]);
    });

    it('les jours précédant l’écart sont considérés comme suivis', () => {
      const outcome = replanner.replan(
        plan41,
        2,
        actually(plan41.days[2], { arrival: at('08:30') }),
      );

      expect(outcome.plan.days[0]).toBe(plan41.days[0]);
      expect(outcome.plan.days[1]).toBe(plan41.days[1]);
      expect(outcome.plan.days[2]?.worked.format()).toBe('7h42');
      expect(outcome.plan.totalWorked.equals(h(41))).toBe(true);
    });
  });

  describe('alertes', () => {
    it('signale l’écart du jour', () => {
      const outcome = replanner.replan(
        plan41,
        0,
        actually(plan41.days[0], { departure: at('16:07') }),
      );

      expect(outcome.alerts).toEqual([
        { kind: 'day-gap', message: '-0h50 par rapport au plan le lundi.' },
      ]);
    });

    it('aucune alerte quand la journée s’est passée comme prévu', () => {
      const outcome = replanner.replan(plan41, 0, actually(plan41.days[0], {}));

      expect(outcome.alerts).toEqual([]);
      expect(outcome.gap.isZero()).toBe(true);
    });

    it('signale une règle non respectée (pause de 30 min), même sans écart de temps', () => {
      const outcome = replanner.replan(
        plan41,
        0,
        actually(plan41.days[0], { lunchBreak: TimeSlot.between(at('12:15'), at('12:45')) }),
      );

      expect(outcome.alerts).toEqual([
        { kind: 'rule-violation', message: 'Pause de 0h30 : 0h45 minimum.' },
      ]);
    });

    it('objectif hors d’atteinte : jours restants au maximum et manque indiqué', () => {
      const maxPlan = generator.planForTotalHours(WEEK, h(49, 15));
      const outcome = replanner.replan(
        maxPlan,
        0,
        actually(maxPlan.days[0], { departure: at('17:15') }),
      );

      expect(outcome.plan.days.slice(1).map((day) => day.worked.format())).toEqual([
        '10h',
        '10h',
        '10h',
        '9h15',
      ]);
      expect(outcome.plan.totalWorked.equals(h(48, 15))).toBe(true);
      expect(outcome.alerts).toContainEqual({
        kind: 'target-out-of-reach',
        message: 'Objectif hors d’atteinte : il manque 1h sur la période.',
      });
    });

    it('objectif dépassé : jours restants au minimum, le surplus ira au compteur', () => {
      const minPlan = generator.planForTotalHours(WEEK, h(25));
      const outcome = replanner.replan(
        minPlan,
        0,
        actually(minPlan.days[0], {
          arrival: at('07:30'),
          lunchBreak: TimeSlot.between(at('12:15'), at('13:00')),
          departure: at('18:15'),
        }),
      );

      expect(outcome.plan.totalWorked.equals(h(29, 30))).toBe(true);
      expect(outcome.alerts).toContainEqual({
        kind: 'target-exceeded',
        message: 'Objectif dépassé : 4h30 de plus sur la période, elles iront au compteur.',
      });
    });

    it('écart le dernier jour : plus rien à recalculer, le manque est signalé', () => {
      const outcome = replanner.replan(
        plan41,
        4,
        actually(plan41.days[4], { departure: at('15:57') }),
      );

      expect(outcome.plan.days).toHaveLength(5);
      expect(outcome.alerts).toContainEqual({
        kind: 'target-out-of-reach',
        message: 'Objectif hors d’atteinte : il manque 1h sur la période.',
      });
    });
  });

  describe('déclaration invalide', () => {
    it('refuse un jour hors du plan', () => {
      expect(() => replanner.replan(plan41, 5, actually(plan41.days[4], {}))).toThrow(
        InvalidValueError,
      );
    });
  });
});
