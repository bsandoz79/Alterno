import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { Duration } from './duration';
import { TimeOfDay } from './time-of-day';

describe('TimeOfDay', () => {
  describe('création', () => {
    it('se crée à partir d’une heure et de minutes', () => {
      const time = TimeOfDay.of(7, 30);

      expect(time.hours).toBe(7);
      expect(time.minutes).toBe(30);
      expect(time.toMinutesSinceMidnight()).toBe(450);
    });

    it('se lit depuis une chaîne « HH:mm »', () => {
      expect(TimeOfDay.parse('09:00').equals(TimeOfDay.of(9, 0))).toBe(true);
      expect(TimeOfDay.parse('18:15').equals(TimeOfDay.of(18, 15))).toBe(true);
    });

    it.each([
      [24, 0],
      [-1, 0],
      [10, 60],
      [10, -5],
      [7.5, 0],
    ])('refuse l’heure invalide %i:%i', (hours, minutes) => {
      expect(() => TimeOfDay.of(hours, minutes)).toThrow(InvalidValueError);
    });

    it('refuse une chaîne mal formée', () => {
      expect(() => TimeOfDay.parse('7h30')).toThrow(InvalidValueError);
      expect(() => TimeOfDay.parse('25:00')).toThrow(InvalidValueError);
    });
  });

  describe('comparaisons', () => {
    it('sait si une heure est avant ou après une autre', () => {
      const morning = TimeOfDay.of(7, 30);
      const noon = TimeOfDay.of(12, 0);

      expect(morning.isBefore(noon)).toBe(true);
      expect(noon.isAfter(morning)).toBe(true);
      expect(morning.isAfter(noon)).toBe(false);
    });
  });

  describe('calculs', () => {
    it('calcule la durée jusqu’à une heure plus tardive', () => {
      const arrival = TimeOfDay.of(8, 12);
      const departure = TimeOfDay.of(17, 40);

      expect(arrival.durationUntil(departure).equals(Duration.ofHours(9, 28))).toBe(true);
    });

    it('ajoute une durée sans modifier l’original', () => {
      const start = TimeOfDay.of(9, 0);

      const later = start.plus(Duration.ofHours(2, 45));

      expect(later.equals(TimeOfDay.of(11, 45))).toBe(true);
      expect(start.equals(TimeOfDay.of(9, 0))).toBe(true);
    });

    it('refuse un ajout qui dépasse minuit (une journée de travail ne change pas de jour)', () => {
      expect(() => TimeOfDay.of(23, 0).plus(Duration.ofHours(2))).toThrow(InvalidValueError);
    });
  });

  describe('affichage', () => {
    it.each([
      [7, 30, '7h30'],
      [9, 0, '9h00'],
      [17, 5, '17h05'],
    ])('affiche %i:%i comme « %s »', (hours, minutes, expected) => {
      expect(TimeOfDay.of(hours, minutes).format()).toBe(expected);
    });
  });
});
