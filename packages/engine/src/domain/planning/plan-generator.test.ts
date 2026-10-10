import { describe, expect, it } from 'vitest';

import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import type { Weekday } from '../rules/weekday';
import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { PlanValidator } from '../validation/plan-validator';
import { WorkedTimeCalculator } from '../worked-time/worked-time-calculator';
import { ImpossiblePlanError } from './impossible-plan-error';
import type { Plan } from './plan';
import { PlanGenerator } from './plan-generator';

const rules = laBrosseEtDupontRules();
const generator = new PlanGenerator(rules);
const validator = new PlanValidator(rules);
const workedTime = new WorkedTimeCalculator(rules);

const WEEK: readonly Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const h = (hours: number, minutes = 0): Duration => Duration.ofHours(hours, minutes);

/** Chaque journée générée doit respecter les règles et valoir exactement le temps annoncé. */
const expectConsistent = (plan: Plan): void => {
  for (const day of plan.days) {
    expect(validator.validate(day.day, day).violations).toEqual([]);
    expect(workedTime.compute(day.day, day).equals(day.worked)).toBe(true);
  }
};

describe('PlanGenerator — objectif d’heures', () => {
  describe('répartition égale', () => {
    it('répartit 41h en 5 journées de 8h12', () => {
      const plan = generator.planForTotalHours(WEEK, h(41));

      expect(plan.totalWorked.equals(h(41))).toBe(true);
      expect(plan.days.map((day) => day.worked.format())).toEqual([
        '8h12',
        '8h12',
        '8h12',
        '8h12',
        '8h12',
      ]);
      expectConsistent(plan);
    });

    it('utilise l’arrivée et la pause par défaut : 8h00, pause 12h15–13h00, départ 16h57', () => {
      const [monday] = generator.planForTotalHours(WEEK, h(41)).days;

      expect(monday?.arrival.format()).toBe('8h00');
      expect(monday?.lunchBreak.format()).toBe('12h15 – 13h00');
      expect(monday?.departure.format()).toBe('16h57');
    });

    it('répartit sur deux semaines : 77h en 10 journées de 7h42', () => {
      const plan = generator.planForTotalHours([...WEEK, ...WEEK], h(77));

      expect(plan.days).toHaveLength(10);
      expect(plan.days.every((day) => day.worked.equals(h(7, 42)))).toBe(true);
      expectConsistent(plan);
    });
  });

  describe('respect des bornes de chaque jour', () => {
    it('plafonne le vendredi à 9h15 et reporte le reste sur les autres jours (48h)', () => {
      const plan = generator.planForTotalHours(WEEK, h(48));
      const friday = plan.days[4];

      expect(plan.totalWorked.equals(h(48))).toBe(true);
      expect(friday?.worked.equals(h(9, 15))).toBe(true);
      expectConsistent(plan);
    });

    it('produit la semaine maximale : 10h du lundi au jeudi, 9h15 le vendredi (49h15)', () => {
      const plan = generator.planForTotalHours(WEEK, h(49, 15));

      expect(plan.days.map((day) => day.worked.format())).toEqual([
        '10h',
        '10h',
        '10h',
        '10h',
        '9h15',
      ]);
      expect(plan.days[0]?.arrival.format()).toBe('7h30');
      expect(plan.days[0]?.departure.format()).toBe('18h15');
      expectConsistent(plan);
    });
  });

  describe('ajustement des horaires', () => {
    it('décale l’arrivée pour ne pas partir avant 16h00 : 7h → arrivée 8h15, départ 16h00', () => {
      const [monday] = generator.planForTotalHours(WEEK, h(35)).days;

      expect(monday?.arrival.format()).toBe('8h15');
      expect(monday?.departure.format()).toBe('16h00');
      expect(monday?.worked.equals(h(7))).toBe(true);
    });

    it('allonge la pause pour une journée courte : 5h → arrivée 9h00, pause 11h45–13h45', () => {
      const plan = generator.planForTotalHours(WEEK, h(25));
      const [monday] = plan.days;

      expect(monday?.arrival.format()).toBe('9h00');
      expect(monday?.lunchBreak.format()).toBe('11h45 – 13h45');
      expect(monday?.departure.format()).toBe('16h00');
      expectConsistent(plan);
    });
  });

  describe('objectif impossible', () => {
    it('refuse un objectif trop haut en indiquant le manque exact', () => {
      expect(() => generator.planForTotalHours(WEEK, h(52))).toThrow(ImpossiblePlanError);
      expect(() => generator.planForTotalHours(WEEK, h(52))).toThrow(/il manque 2h45/);
    });

    it('refuse un objectif trop bas en indiquant le minimum', () => {
      expect(() => generator.planForTotalHours(WEEK, h(20))).toThrow(/minimum 24h30/);
    });
  });

  describe('période invalide', () => {
    it('refuse une période vide', () => {
      expect(() => generator.planForTotalHours([], h(7))).toThrow(InvalidValueError);
    });

    it('refuse un jour non travaillé dans la période', () => {
      expect(() => generator.planForTotalHours(['monday', 'sunday'], h(14))).toThrow(
        InvalidValueError,
      );
    });
  });
});
