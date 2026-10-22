import { describe, expect, it } from 'vitest';

import { HoursCounter } from '../counter/hours-counter';
import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import type { Weekday } from '../rules/weekday';
import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import { PlanValidator } from '../validation/plan-validator';
import { WorkedTimeCalculator } from '../worked-time/worked-time-calculator';
import { ImpossiblePlanError } from './impossible-plan-error';
import type { Plan } from './plan';
import { PlanGenerator } from './plan-generator';
import type { PlanningPreferences } from './planning-preferences';
import { RecoveryPlanner } from './recovery-planner';

const rules = laBrosseEtDupontRules();
const validator = new PlanValidator(rules);
const workedTime = new WorkedTimeCalculator(rules);

const WEEK: readonly Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const h = (hours: number, minutes = 0): Duration => Duration.ofHours(hours, minutes);
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
const generatorWith = (preferences: PlanningPreferences): PlanGenerator =>
  new PlanGenerator(rules, preferences);

/** Chaque journée générée doit respecter les règles et valoir exactement le temps annoncé. */
const expectConsistent = (plan: Plan): void => {
  for (const day of plan.days) {
    expect(validator.validate(day.day, day).violations).toEqual([]);
    expect(workedTime.compute(day.day, day).equals(day.worked)).toBe(true);
  }
};

describe('Préférences par jour', () => {
  describe('arrivée habituelle', () => {
    it('le lundi à 8h30 : départ décalé à 17h27, les autres jours gardent 8h00', () => {
      const plan = generatorWith({ days: { monday: { arrival: at('08:30') } } }).planForTotalHours(
        WEEK,
        h(41),
      );

      expect(plan.days[0]?.arrival.format()).toBe('8h30');
      expect(plan.days[0]?.departure.format()).toBe('17h27');
      expect(plan.days[1]?.arrival.format()).toBe('8h00');
      expectConsistent(plan);
    });
  });

  describe('pause habituelle', () => {
    it('le vendredi de 12h00 à 12h45', () => {
      const plan = generatorWith({
        days: { friday: { lunchBreak: TimeSlot.between(at('12:00'), at('12:45')) } },
      }).planForTotalHours(WEEK, h(41));

      expect(plan.days[4]?.lunchBreak.format()).toBe('12h00 – 12h45');
      expect(plan.days[0]?.lunchBreak.format()).toBe('12h15 – 13h00');
      expectConsistent(plan);
    });
  });

  describe('départ au plus tard', () => {
    const wednesdayBefore5pm: PlanningPreferences = {
      days: { wednesday: { latestDeparture: at('17:00') } },
    };

    it('plafonne le mercredi à 8h45 (départ 17h00) et reporte le reste sur les autres jours (48h)', () => {
      const plan = generatorWith(wednesdayBefore5pm).planForTotalHours(WEEK, h(48));
      const wednesday = plan.days[2];

      expect(wednesday?.worked.format()).toBe('8h45');
      expect(wednesday?.departure.format()).toBe('17h00');
      expect(plan.totalWorked.equals(h(48))).toBe(true);
      expectConsistent(plan);
    });

    it('réduit le maximum de la semaine : 49h15 devient impossible, il manque 1h15', () => {
      expect(() => generatorWith(wednesdayBefore5pm).planForTotalHours(WEEK, h(49, 15))).toThrow(
        /il manque 1h15/,
      );
    });

    it('s’applique aussi à une récup : le maximum avant la récup tient compte du plafond', () => {
      const planner = new RecoveryPlanner(rules, wednesdayBefore5pm);
      const days: readonly Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday'];
      // Avec -10h : 17h à rattraper, dont 4h de découvert, soit 4 × 7h + 13h = 41h,
      // pour 38h45 possibles avec le mercredi plafonné.
      const tooMuch = (): Plan => planner.planForRecovery(days, HoursCounter.of(h(-10)), 'full');

      expect(tooMuch).toThrow(ImpossiblePlanError);
      expect(tooMuch).toThrow(/il manque 2h15/);
    });
  });

  describe('jour à 7h pile', () => {
    it('le mercredi reste à 7h, les autres jours absorbent l’objectif (41h)', () => {
      const plan = generatorWith({
        days: { wednesday: { exactlyExpected: true } },
      }).planForTotalHours(WEEK, h(41));

      expect(plan.days.map((day) => day.worked.format())).toEqual([
        '8h30',
        '8h30',
        '7h',
        '8h30',
        '8h30',
      ]);
      expectConsistent(plan);
    });
  });

  describe('heures en plus : partir plus tard ou arriver plus tôt', () => {
    it('par défaut, le lundi garde son arrivée et part plus tard (7h24 : 8h00 – 16h09)', () => {
      const plan = generatorWith({}).planForTotalHours(WEEK, h(37));

      expect(plan.days[0]?.arrival.format()).toBe('8h00');
      expect(plan.days[0]?.departure.format()).toBe('16h09');
    });

    it('« arriver plus tôt » le lundi : le départ reste à 16h00, l’arrivée avance à 7h51 (7h24)', () => {
      const plan = generatorWith({
        days: { monday: { flexibleEnd: 'arrival' } },
      }).planForTotalHours(WEEK, h(37));

      expect(plan.days[0]?.arrival.format()).toBe('7h51');
      expect(plan.days[0]?.departure.format()).toBe('16h00');
      expect(plan.days[1]?.arrival.format()).toBe('8h00');
      expectConsistent(plan);
    });

    it('« arriver plus tôt » : une fois à 7h30, le reste repousse le départ (8h12 : 7h30 – 16h27)', () => {
      const plan = generatorWith({
        days: { monday: { flexibleEnd: 'arrival' } },
      }).planForTotalHours(WEEK, h(41));

      expect(plan.days[0]?.arrival.format()).toBe('7h30');
      expect(plan.days[0]?.departure.format()).toBe('16h27');
      expectConsistent(plan);
    });

    it('« arriver plus tôt » avec des heures en moins : arrivée plus tard, départ gardé (6h25 : 8h55 – 16h05)', () => {
      const plan = generatorWith({
        defaults: { arrival: at('08:20'), lunchBreak: TimeSlot.between(at('12:15'), at('13:00')) },
        days: { thursday: { flexibleEnd: 'arrival' } },
      }).planForTotalHours(['thursday'], h(6, 25));

      expect(plan.days[0]?.arrival.format()).toBe('8h55');
      expect(plan.days[0]?.departure.format()).toBe('16h05');
      expectConsistent(plan);
    });

    it('« arriver plus tôt » : le départ gardé ne dépasse pas le départ au plus tard (7h : 8h15 – 17h00)', () => {
      const plan = generatorWith({
        days: {
          monday: {
            arrival: at('09:00'),
            lunchBreak: TimeSlot.between(at('12:00'), at('13:45')),
            latestDeparture: at('17:00'),
            flexibleEnd: 'arrival',
          },
        },
      }).planForTotalHours(['monday'], h(7));

      expect(plan.days[0]?.arrival.format()).toBe('8h15');
      expect(plan.days[0]?.departure.format()).toBe('17h00');
      expectConsistent(plan);
    });
  });

  describe('arrivée au plus tôt', () => {
    const shortFriday: PlanningPreferences = {
      defaults: { arrival: at('08:20'), lunchBreak: TimeSlot.between(at('12:15'), at('13:00')) },
      days: { friday: { earliestArrival: at('08:20'), latestDeparture: at('15:30') } },
    };

    it('vendredi court : 8h20 – 15h30 sans arriver plus tôt, le manque va sur les autres jours (35h)', () => {
      const plan = generatorWith(shortFriday).planForTotalHours(WEEK, h(35));
      const friday = plan.days[4];

      expect(friday?.arrival.format()).toBe('8h20');
      expect(friday?.departure.format()).toBe('15h30');
      expect(friday?.worked.format()).toBe('6h25');
      expect(plan.days.slice(0, 4).map((day) => day.worked.format())).toEqual([
        '7h09',
        '7h09',
        '7h09',
        '7h08',
      ]);
      expect(plan.totalWorked.equals(h(35))).toBe(true);
      expectConsistent(plan);
    });

    it('réduit le maximum de la semaine en conséquence', () => {
      const generator = generatorWith(shortFriday);

      expect(generator.maximumTotal(['friday']).format()).toBe('6h25');
    });

    it('refuse une arrivée au plus tôt avant la plage d’arrivée', () => {
      expect(() => generatorWith({ days: { friday: { earliestArrival: at('07:00') } } })).toThrow(
        /vendredi.*7h00/,
      );
    });

    it('refuse une arrivée au plus tôt après l’arrivée habituelle du jour', () => {
      expect(() =>
        generatorWith({ days: { friday: { arrival: at('08:00'), earliestArrival: at('08:20') } } }),
      ).toThrow(/vendredi.*8h20.*8h00/);
    });
  });

  describe('préférences incohérentes avec les règles', () => {
    it('refuse une arrivée après le début de la plage fixe', () => {
      expect(() => generatorWith({ days: { monday: { arrival: at('09:30') } } })).toThrow(
        InvalidValueError,
      );
      expect(() => generatorWith({ days: { monday: { arrival: at('09:30') } } })).toThrow(
        /lundi.*9h30/,
      );
    });

    it('refuse un départ au plus tard avant la fin de la plage fixe', () => {
      expect(() =>
        generatorWith({ days: { wednesday: { latestDeparture: at('15:00') } } }),
      ).toThrow(/mercredi.*15h00/);
    });

    it('refuse une pause hors de la plage de déjeuner', () => {
      expect(() =>
        generatorWith({
          days: { friday: { lunchBreak: TimeSlot.between(at('11:00'), at('11:45')) } },
        }),
      ).toThrow(/vendredi.*11h00 – 11h45/);
    });
  });
});
