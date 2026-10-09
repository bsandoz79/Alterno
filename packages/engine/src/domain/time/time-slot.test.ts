import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { Duration } from './duration';
import { TimeOfDay } from './time-of-day';
import { TimeSlot } from './time-slot';

const at = (hours: number, minutes = 0): TimeOfDay => TimeOfDay.of(hours, minutes);

describe('TimeSlot', () => {
  describe('création', () => {
    it('se crée entre une heure de début et une heure de fin', () => {
      const slot = TimeSlot.between(at(9), at(11, 45));

      expect(slot.start.equals(at(9))).toBe(true);
      expect(slot.end.equals(at(11, 45))).toBe(true);
    });

    it('refuse une fin antérieure ou égale au début', () => {
      expect(() => TimeSlot.between(at(12), at(9))).toThrow(InvalidValueError);
      expect(() => TimeSlot.between(at(9), at(9))).toThrow(InvalidValueError);
    });
  });

  describe('durée', () => {
    it('calcule sa durée (plage fixe du matin : 2h45)', () => {
      expect(TimeSlot.between(at(9), at(11, 45)).duration().equals(Duration.ofHours(2, 45))).toBe(
        true,
      );
    });
  });

  describe('appartenance', () => {
    const slot = TimeSlot.between(at(7, 30), at(9));

    it('contient une heure comprise entre le début (inclus) et la fin (exclue)', () => {
      expect(slot.contains(at(7, 30))).toBe(true);
      expect(slot.contains(at(8, 15))).toBe(true);
      expect(slot.contains(at(9))).toBe(false);
      expect(slot.contains(at(7))).toBe(false);
    });
  });

  describe('chevauchement', () => {
    const fixedMorning = TimeSlot.between(at(9), at(11, 45));

    it('détecte deux plages qui se chevauchent', () => {
      expect(fixedMorning.overlaps(TimeSlot.between(at(11), at(12)))).toBe(true);
    });

    it('ne considère pas comme chevauchantes deux plages qui se touchent', () => {
      expect(fixedMorning.overlaps(TimeSlot.between(at(11, 45), at(13, 45)))).toBe(false);
    });

    it('calcule la durée commune entre deux plages', () => {
      const worked = TimeSlot.between(at(8, 12), at(11, 50));

      expect(worked.overlapDuration(fixedMorning).equals(Duration.ofHours(2, 45))).toBe(true);
    });

    it('renvoie une durée nulle quand les plages ne se chevauchent pas', () => {
      const afternoon = TimeSlot.between(at(14), at(16));

      expect(afternoon.overlapDuration(fixedMorning).isZero()).toBe(true);
    });
  });

  describe('affichage', () => {
    it('s’affiche sous la forme « début – fin »', () => {
      expect(TimeSlot.between(at(9), at(11, 45)).format()).toBe('9h00 – 11h45');
    });
  });
});
