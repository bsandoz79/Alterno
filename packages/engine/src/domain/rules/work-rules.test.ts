import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import { DaySchedule } from './day-schedule';
import { laBrosseEtDupontRules } from './presets/la-brosse-et-dupont';
import { WorkRules } from './work-rules';

const slot = (start: string, end: string): TimeSlot =>
  TimeSlot.between(TimeOfDay.parse(start), TimeOfDay.parse(end));

const standardDay = DaySchedule.create({
  flexibleArrival: slot('07:30', '09:00'),
  morningCore: slot('09:00', '11:45'),
  lunchWindow: slot('11:45', '13:45'),
  afternoonCore: slot('13:45', '16:00'),
  flexibleDeparture: slot('16:00', '18:15'),
});

describe('WorkRules', () => {
  describe('règles de La Brosse et Dupont (configuration par défaut)', () => {
    const rules = laBrosseEtDupontRules();

    it('travaille du lundi au vendredi, pas le week-end', () => {
      expect(rules.isWorkingDay('monday')).toBe(true);
      expect(rules.isWorkingDay('friday')).toBe(true);
      expect(rules.isWorkingDay('saturday')).toBe(false);
      expect(rules.isWorkingDay('sunday')).toBe(false);
    });

    it('attend 7h par jour, une récup vaut 7h et une demi-récup 3h30', () => {
      expect(rules.expectedDailyWork.equals(Duration.ofHours(7))).toBe(true);
      expect(rules.fullDayRecovery.equals(Duration.ofHours(7))).toBe(true);
      expect(rules.halfDayRecovery.equals(Duration.ofHours(3, 30))).toBe(true);
    });

    it('impose une pause déjeuner d’au moins 45 min', () => {
      expect(rules.minimumLunchBreak.equals(Duration.ofMinutes(45))).toBe(true);
    });

    it('déduit la pause minimale même si la pause réelle est plus courte (règle par défaut)', () => {
      expect(rules.lunchBreakPolicy).toBe('minimum-enforced');
    });

    it('finit la plage fixe de l’après-midi à 15h30 le vendredi', () => {
      expect(rules.scheduleFor('friday').afternoonCore.end.equals(TimeOfDay.parse('15:30'))).toBe(
        true,
      );
    });

    it.each([
      ['monday', 5, 0],
      ['thursday', 5, 0],
      ['friday', 4, 30],
    ] as const)('journée minimale le %s : %ih%i (plages fixes seules)', (day, hours, minutes) => {
      expect(rules.minimumWorkedTime(day).equals(Duration.ofHours(hours, minutes))).toBe(true);
    });

    it.each([
      ['monday', 10, 0],
      ['thursday', 10, 0],
      ['friday', 9, 15],
    ] as const)(
      'journée maximale le %s : %ih%i (amplitude complète moins la pause minimale)',
      (day, hours, minutes) => {
        expect(rules.maximumWorkedTime(day).equals(Duration.ofHours(hours, minutes))).toBe(true);
      },
    );

    it('liste les jours travaillés dans l’ordre de la semaine', () => {
      expect(rules.workingDays()).toEqual(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    });

    it('refuse de donner les horaires d’un jour non travaillé', () => {
      expect(() => rules.scheduleFor('sunday')).toThrow(InvalidValueError);
      expect(() => rules.minimumWorkedTime('saturday')).toThrow(InvalidValueError);
    });
  });

  describe('validation de la configuration', () => {
    it('refuse une pause minimale plus longue que la plage de déjeuner', () => {
      expect(() =>
        WorkRules.create({
          week: { monday: standardDay },
          minimumLunchBreak: Duration.ofHours(3),
          expectedDailyWork: Duration.ofHours(7),
          fullDayRecovery: Duration.ofHours(7),
          halfDayRecovery: Duration.ofHours(3, 30),
        }),
      ).toThrow(InvalidValueError);
    });

    it('refuse un temps attendu par jour impossible à atteindre', () => {
      expect(() =>
        WorkRules.create({
          week: { monday: standardDay },
          minimumLunchBreak: Duration.ofMinutes(45),
          expectedDailyWork: Duration.ofHours(11),
          fullDayRecovery: Duration.ofHours(11),
          halfDayRecovery: Duration.ofHours(5, 30),
        }),
      ).toThrow(InvalidValueError);
    });

    it.each([
      ['une pause minimale nulle', { minimumLunchBreak: Duration.zero() }],
      ['un temps attendu négatif', { expectedDailyWork: Duration.ofHours(-7) }],
      ['une demi-récupération nulle', { halfDayRecovery: Duration.zero() }],
    ])('refuse %s (les durées doivent être strictement positives)', (_case, override) => {
      expect(() =>
        WorkRules.create({
          week: { monday: standardDay },
          minimumLunchBreak: Duration.ofMinutes(45),
          expectedDailyWork: Duration.ofHours(7),
          fullDayRecovery: Duration.ofHours(7),
          halfDayRecovery: Duration.ofHours(3, 30),
          ...override,
        }),
      ).toThrow(InvalidValueError);
    });

    it('refuse une semaine sans aucun jour travaillé', () => {
      expect(() =>
        WorkRules.create({
          week: {},
          minimumLunchBreak: Duration.ofMinutes(45),
          expectedDailyWork: Duration.ofHours(7),
          fullDayRecovery: Duration.ofHours(7),
          halfDayRecovery: Duration.ofHours(3, 30),
        }),
      ).toThrow(InvalidValueError);
    });
  });
});
