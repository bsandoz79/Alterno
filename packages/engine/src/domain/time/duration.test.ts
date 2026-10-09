import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { Duration } from './duration';

describe('Duration', () => {
  describe('création', () => {
    it('se crée à partir de minutes', () => {
      expect(Duration.ofMinutes(90).toMinutes()).toBe(90);
    });

    it('se crée à partir d’heures et de minutes', () => {
      expect(Duration.ofHours(7, 45).toMinutes()).toBe(465);
    });

    it('vaut zéro par défaut avec Duration.zero()', () => {
      expect(Duration.zero().toMinutes()).toBe(0);
    });

    it('accepte une durée négative (un compteur peut être en déficit)', () => {
      expect(Duration.ofMinutes(-30).toMinutes()).toBe(-30);
    });

    it('refuse un nombre de minutes non entier', () => {
      expect(() => Duration.ofMinutes(1.5)).toThrow(InvalidValueError);
    });

    it('refuse une valeur non finie', () => {
      expect(() => Duration.ofMinutes(Number.NaN)).toThrow(InvalidValueError);
      expect(() => Duration.ofMinutes(Number.POSITIVE_INFINITY)).toThrow(InvalidValueError);
    });
  });

  describe('calculs', () => {
    it('additionne deux durées sans modifier les originales (immuabilité)', () => {
      const a = Duration.ofHours(7);
      const b = Duration.ofMinutes(45);

      const sum = a.plus(b);

      expect(sum.toMinutes()).toBe(465);
      expect(a.toMinutes()).toBe(420);
      expect(b.toMinutes()).toBe(45);
    });

    it('soustrait une durée et peut devenir négative', () => {
      expect(Duration.ofHours(6).minus(Duration.ofHours(7)).toMinutes()).toBe(-60);
    });

    it('donne l’opposé et la valeur absolue', () => {
      expect(Duration.ofMinutes(30).negate().toMinutes()).toBe(-30);
      expect(Duration.ofMinutes(-30).abs().toMinutes()).toBe(30);
    });
  });

  describe('comparaisons', () => {
    it('compare deux durées', () => {
      const short = Duration.ofHours(5);
      const long = Duration.ofHours(10);

      expect(short.isLessThan(long)).toBe(true);
      expect(long.isGreaterThan(short)).toBe(true);
      expect(short.isGreaterThan(long)).toBe(false);
    });

    it('considère égales deux durées de même valeur', () => {
      expect(Duration.ofHours(1).equals(Duration.ofMinutes(60))).toBe(true);
    });

    it('indique si la durée est négative ou nulle', () => {
      expect(Duration.ofMinutes(-1).isNegative()).toBe(true);
      expect(Duration.zero().isZero()).toBe(true);
      expect(Duration.ofMinutes(1).isNegative()).toBe(false);
    });
  });

  describe('affichage', () => {
    it.each([
      [465, '7h45'],
      [420, '7h'],
      [425, '7h05'],
      [0, '0h'],
      [-70, '-1h10'],
      [30, '0h30'],
    ])('affiche %i minutes comme « %s »', (minutes, expected) => {
      expect(Duration.ofMinutes(minutes).format()).toBe(expected);
    });

    it('affiche le signe + quand on le demande (écart au compteur)', () => {
      expect(Duration.ofMinutes(135).format({ signed: true })).toBe('+2h15');
      expect(Duration.ofMinutes(-135).format({ signed: true })).toBe('-2h15');
      expect(Duration.zero().format({ signed: true })).toBe('0h');
    });
  });
});
