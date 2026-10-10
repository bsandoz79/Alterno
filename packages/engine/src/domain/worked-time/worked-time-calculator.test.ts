import { describe, expect, it } from 'vitest';

import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import { WorkRules } from '../rules/work-rules';
import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import { WorkedTimeCalculator } from './worked-time-calculator';

const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
const pause = (start: string, end: string): TimeSlot => TimeSlot.between(at(start), at(end));

const rules = laBrosseEtDupontRules();
const calculator = new WorkedTimeCalculator(rules);

describe('WorkedTimeCalculator', () => {
  describe('journée classique', () => {
    it('compte la présence moins la pause : 8h00–17h40 avec 45 min de pause = 8h55', () => {
      const worked = calculator.compute('monday', {
        arrival: at('08:00'),
        departure: at('17:40'),
        lunchBreak: pause('11:50', '12:35'),
      });

      expect(worked.equals(Duration.ofHours(8, 55))).toBe(true);
    });

    it('déduit la pause réelle quand elle dépasse le minimum : 1h15 de pause', () => {
      const worked = calculator.compute('monday', {
        arrival: at('08:00'),
        departure: at('17:00'),
        lunchBreak: pause('11:45', '13:00'),
      });

      expect(worked.equals(Duration.ofHours(7, 45))).toBe(true);
    });
  });

  describe('pause plus courte que le minimum', () => {
    const shortBreakDay = {
      arrival: at('08:00'),
      departure: at('16:00'),
      lunchBreak: pause('12:00', '12:30'),
    };

    it('déduit quand même 45 min par défaut (pause minimale imposée)', () => {
      expect(calculator.compute('monday', shortBreakDay).equals(Duration.ofHours(7, 15))).toBe(
        true,
      );
    });

    it('déduit seulement la pause réelle si la règle « pause réelle » est choisie', () => {
      const actualBreakRules = WorkRules.create({
        week: { monday: rules.scheduleFor('monday') },
        minimumLunchBreak: rules.minimumLunchBreak,
        expectedDailyWork: rules.expectedDailyWork,
        fullDayRecovery: rules.fullDayRecovery,
        halfDayRecovery: rules.halfDayRecovery,
        lunchBreakPolicy: 'actual',
      });

      const worked = new WorkedTimeCalculator(actualBreakRules).compute('monday', shortBreakDay);

      expect(worked.equals(Duration.ofHours(7, 30))).toBe(true);
    });
  });

  describe('temps hors des plages variables', () => {
    it('ne compte pas le temps avant 7h30', () => {
      const worked = calculator.compute('monday', {
        arrival: at('07:00'),
        departure: at('16:00'),
        lunchBreak: pause('11:45', '12:30'),
      });

      expect(worked.equals(Duration.ofHours(7, 45))).toBe(true);
    });

    it('ne compte pas le temps après 18h15', () => {
      const worked = calculator.compute('monday', {
        arrival: at('09:00'),
        departure: at('18:45'),
        lunchBreak: pause('11:45', '12:30'),
      });

      expect(worked.equals(Duration.ofHours(8, 30))).toBe(true);
    });

    it('applique les plages du vendredi : rien n’est compté après 17h30', () => {
      const worked = calculator.compute('friday', {
        arrival: at('07:30'),
        departure: at('18:00'),
        lunchBreak: pause('11:45', '12:30'),
      });

      expect(worked.equals(rules.maximumWorkedTime('friday'))).toBe(true);
    });
  });

  describe('cas limites', () => {
    it('renvoie zéro si la présence comptée est plus courte que la pause minimale', () => {
      const worked = calculator.compute('monday', {
        arrival: at('06:00'),
        departure: at('07:45'),
        lunchBreak: pause('07:00', '07:15'),
      });

      expect(worked.isZero()).toBe(true);
    });
  });

  describe('cas invalides', () => {
    it('refuse un départ avant ou à l’heure d’arrivée', () => {
      expect(() =>
        calculator.compute('monday', {
          arrival: at('17:00'),
          departure: at('08:00'),
          lunchBreak: pause('11:45', '12:30'),
        }),
      ).toThrow(InvalidValueError);
    });

    it('refuse un jour non travaillé', () => {
      expect(() =>
        calculator.compute('sunday', {
          arrival: at('08:00'),
          departure: at('16:00'),
          lunchBreak: pause('11:45', '12:30'),
        }),
      ).toThrow(InvalidValueError);
    });
  });
});
