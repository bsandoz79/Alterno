import { describe, expect, it } from 'vitest';

import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import { Duration } from '../time/duration';
import { CounterCalculator } from './counter-calculator';
import { InsufficientCounterError } from './insufficient-counter-error';
import { HoursCounter } from './hours-counter';

const h = (hours: number, minutes = 0): Duration => Duration.ofHours(hours, minutes);
const counterAt = (hours: number, minutes = 0): HoursCounter => HoursCounter.of(h(hours, minutes));

const calculator = new CounterCalculator(laBrosseEtDupontRules());

describe('CounterCalculator', () => {
  describe('écart d’une journée', () => {
    it('ajoute le surplus au compteur quand la journée dépasse 7h', () => {
      expect(calculator.dayBalance(h(8)).equals(h(1))).toBe(true);
    });

    it('prend dans le compteur quand la journée fait moins de 7h', () => {
      expect(calculator.dayBalance(h(6, 30)).equals(Duration.ofMinutes(-30))).toBe(true);
    });

    it('est neutre pour une journée de 7h pile', () => {
      expect(calculator.dayBalance(h(7)).isZero()).toBe(true);
    });
  });

  describe('cumul sur une période', () => {
    it('donne +7h pour une semaine de 42h (5 × 8h24)', () => {
      const week = [h(8, 24), h(8, 24), h(8, 24), h(8, 24), h(8, 24)];

      const counter = calculator.applyWorkedDays(HoursCounter.zero(), week);

      expect(counter.balance.equals(h(7))).toBe(true);
    });

    it('part du compteur existant : +2h15 puis 8h55, 8h50, 8h, 7h donne +7h', () => {
      const counter = calculator.applyWorkedDays(counterAt(2, 15), [
        h(8, 55),
        h(8, 50),
        h(8),
        h(7),
      ]);

      expect(counter.balance.equals(h(7))).toBe(true);
    });

    it('applique une seule journée', () => {
      expect(calculator.applyWorkedDay(counterAt(1), h(6)).balance.isZero()).toBe(true);
    });
  });

  describe('possibilité de récupération', () => {
    it.each([
      [7, 0, 'full', true],
      [6, 59, 'full', false],
      [6, 59, 'half', true],
      [3, 30, 'half', true],
      [3, 29, 'half', false],
    ] as const)(
      'avec %ih%i au compteur, une récup « %s » possible : %s',
      (hours, minutes, kind, expected) => {
        expect(calculator.canTakeRecovery(counterAt(hours, minutes), kind)).toBe(expected);
      },
    );
  });

  describe('prise d’une récupération', () => {
    it('une journée de récup retire 7h : +7h revient à 0', () => {
      expect(calculator.takeRecovery(counterAt(7), 'full').balance.isZero()).toBe(true);
    });

    it('une demi-journée retire 3h30 quand on travaille l’autre moitié (3h30)', () => {
      expect(calculator.takeRecovery(counterAt(5), 'half').balance.equals(h(1, 30))).toBe(true);
    });

    it('tient compte du temps réellement travaillé pendant la demi-journée', () => {
      const counter = calculator.takeRecovery(counterAt(5), 'half', h(4));

      expect(counter.balance.equals(h(2))).toBe(true);
    });

    it('refuse une récup sans solde suffisant, avec le manque dans le message', () => {
      expect(() => calculator.takeRecovery(counterAt(6), 'full')).toThrow(InsufficientCounterError);
      expect(() => calculator.takeRecovery(counterAt(6), 'full')).toThrow(/1h/);
    });
  });
});
