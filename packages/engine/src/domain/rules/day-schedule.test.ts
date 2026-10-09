import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import { DaySchedule } from './day-schedule';

const slot = (start: string, end: string): TimeSlot =>
  TimeSlot.between(TimeOfDay.parse(start), TimeOfDay.parse(end));

const mondayToThursday = () =>
  DaySchedule.create({
    flexibleArrival: slot('07:30', '09:00'),
    morningCore: slot('09:00', '11:45'),
    lunchWindow: slot('11:45', '13:45'),
    afternoonCore: slot('13:45', '16:00'),
    flexibleDeparture: slot('16:00', '18:15'),
  });

const friday = () =>
  DaySchedule.create({
    flexibleArrival: slot('07:30', '09:00'),
    morningCore: slot('09:00', '11:45'),
    lunchWindow: slot('11:45', '13:45'),
    afternoonCore: slot('13:45', '15:30'),
    flexibleDeparture: slot('15:30', '17:30'),
  });

describe('DaySchedule', () => {
  describe('création', () => {
    it('expose les bornes d’arrivée et de départ', () => {
      const schedule = mondayToThursday();

      expect(schedule.earliestArrival.equals(TimeOfDay.parse('07:30'))).toBe(true);
      expect(schedule.latestArrival.equals(TimeOfDay.parse('09:00'))).toBe(true);
      expect(schedule.earliestDeparture.equals(TimeOfDay.parse('16:00'))).toBe(true);
      expect(schedule.latestDeparture.equals(TimeOfDay.parse('18:15'))).toBe(true);
    });

    it('expose ses cinq plages dans l’ordre de la journée', () => {
      const schedule = mondayToThursday();

      expect(schedule.flexibleArrival.format()).toBe('7h30 – 9h00');
      expect(schedule.morningCore.format()).toBe('9h00 – 11h45');
      expect(schedule.lunchWindow.format()).toBe('11h45 – 13h45');
      expect(schedule.afternoonCore.format()).toBe('13h45 – 16h00');
      expect(schedule.flexibleDeparture.format()).toBe('16h00 – 18h15');
    });

    it('refuse des plages qui ne s’enchaînent pas (trou entre deux plages)', () => {
      expect(() =>
        DaySchedule.create({
          flexibleArrival: slot('07:30', '09:00'),
          morningCore: slot('09:15', '11:45'),
          lunchWindow: slot('11:45', '13:45'),
          afternoonCore: slot('13:45', '16:00'),
          flexibleDeparture: slot('16:00', '18:15'),
        }),
      ).toThrow(InvalidValueError);
    });

    it('refuse des plages qui se chevauchent', () => {
      expect(() =>
        DaySchedule.create({
          flexibleArrival: slot('07:30', '09:00'),
          morningCore: slot('09:00', '12:00'),
          lunchWindow: slot('11:45', '13:45'),
          afternoonCore: slot('13:45', '16:00'),
          flexibleDeparture: slot('16:00', '18:15'),
        }),
      ).toThrow(InvalidValueError);
    });
  });

  describe('durées', () => {
    it('calcule le temps des plages fixes : 5h du lundi au jeudi', () => {
      expect(mondayToThursday().coreDuration().equals(Duration.ofHours(5))).toBe(true);
    });

    it('calcule le temps des plages fixes : 4h30 le vendredi', () => {
      expect(friday().coreDuration().equals(Duration.ofHours(4, 30))).toBe(true);
    });

    it('calcule l’amplitude maximale de présence (arrivée au plus tôt → départ au plus tard)', () => {
      expect(mondayToThursday().maximumSpan().equals(Duration.ofHours(10, 45))).toBe(true);
      expect(friday().maximumSpan().equals(Duration.ofHours(10))).toBe(true);
    });
  });
});
