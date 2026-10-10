import { describe, expect, it } from 'vitest';

import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import type { Weekday } from '../rules/weekday';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import type { WorkedDayInput } from '../worked-time/worked-time-calculator';
import { PlanValidator } from './plan-validator';
import type { DayContext, RuleViolation, ScheduleRule } from './schedule-rule';

const at = (value: string): TimeOfDay => TimeOfDay.parse(value);

const plannedDay = (
  arrival: string,
  departure: string,
  lunchStart = '12:15',
  lunchEnd = '13:00',
): WorkedDayInput => ({
  arrival: at(arrival),
  departure: at(departure),
  lunchBreak: TimeSlot.between(at(lunchStart), at(lunchEnd)),
});

const validator = new PlanValidator(laBrosseEtDupontRules());
const check = (day: Weekday, input: WorkedDayInput) => validator.validate(day, input);

describe('PlanValidator', () => {
  describe('journée valide', () => {
    it('accepte une journée classique : 8h00–17h40, pause 12h15–13h00', () => {
      const result = check('monday', plannedDay('08:00', '17:40'));

      expect(result.isValid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('accepte les bornes exactes : arrivée 7h30 ou 9h00, départ 16h00 ou 18h15', () => {
      expect(check('monday', plannedDay('07:30', '16:00')).isValid).toBe(true);
      expect(check('monday', plannedDay('09:00', '18:15')).isValid).toBe(true);
    });
  });

  describe('arrivée', () => {
    it('refuse une arrivée après 9h00, avec un message explicite', () => {
      const result = check('monday', plannedDay('09:10', '17:40'));

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]?.message).toBe(
        'Arrivée à 9h10 : elle doit se situer entre 7h30 et 9h00.',
      );
    });

    it('refuse une arrivée avant 7h30', () => {
      expect(check('monday', plannedDay('07:15', '16:00')).isValid).toBe(false);
    });
  });

  describe('départ', () => {
    it('refuse un départ avant 16h00 du lundi au jeudi', () => {
      const result = check('monday', plannedDay('08:00', '15:45'));

      expect(result.violations[0]?.message).toBe(
        'Départ à 15h45 : il doit se situer entre 16h00 et 18h15.',
      );
    });

    it('accepte un départ à 15h45 le vendredi (plage fixe jusqu’à 15h30)', () => {
      expect(check('friday', plannedDay('08:00', '15:45')).isValid).toBe(true);
    });

    it('refuse un plan à 10h30 de travail un lundi (départ forcément après 18h15)', () => {
      const result = check('monday', plannedDay('07:30', '18:45'));

      expect(result.isValid).toBe(false);
      expect(result.violations[0]?.rule).toBe('departure-window');
    });
  });

  describe('pause déjeuner', () => {
    it('refuse une pause de moins de 45 min', () => {
      const result = check('monday', plannedDay('08:00', '17:00', '12:15', '12:45'));

      expect(result.violations[0]?.message).toBe('Pause de 0h30 : 0h45 minimum.');
    });

    it('refuse une pause qui déborde de la plage 11h45–13h45', () => {
      const result = check('monday', plannedDay('08:00', '17:00', '13:15', '14:00'));

      expect(result.violations[0]?.message).toBe(
        'La pause doit être prise entre 11h45 et 13h45 (prévue 13h15 – 14h00).',
      );
    });
  });

  describe('plusieurs erreurs', () => {
    it('liste toutes les erreurs d’un coup : arrivée tardive et pause trop courte', () => {
      const result = check('monday', plannedDay('09:30', '17:00', '12:15', '12:30'));

      expect(result.violations.map((violation) => violation.rule)).toEqual([
        'arrival-window',
        'lunch-break',
      ]);
    });
  });

  describe('jour non travaillé', () => {
    it('refuse un plan un dimanche', () => {
      const result = check('sunday', plannedDay('08:00', '17:00'));

      expect(result.isValid).toBe(false);
      expect(result.violations[0]?.message).toBe('Le dimanche n’est pas un jour travaillé.');
    });
  });

  describe('extensibilité (principe ouvert/fermé)', () => {
    it('applique une règle supplémentaire sans modifier le validateur', () => {
      const noFridayAfter17: ScheduleRule = {
        name: 'friday-before-17h',
        check: ({ day, input }: DayContext): readonly RuleViolation[] =>
          day === 'friday' && input.departure.isAfter(at('17:00'))
            ? [{ rule: 'friday-before-17h', message: 'Le vendredi, je pars avant 17h.' }]
            : [],
      };
      const customValidator = new PlanValidator(laBrosseEtDupontRules(), [noFridayAfter17]);

      const result = customValidator.validate('friday', plannedDay('08:00', '17:15'));

      expect(result.violations).toEqual([
        { rule: 'friday-before-17h', message: 'Le vendredi, je pars avant 17h.' },
      ]);
    });
  });
});
