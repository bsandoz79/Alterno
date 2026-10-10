import { describe, expect, it } from 'vitest';

import { Duration } from '../../time/duration';
import { ImpossiblePlanError } from '../impossible-plan-error';
import { FastPace } from './fast-pace';
import { LatePace } from './late-pace';
import type { PaceStrategy } from './pace-strategy';
import { SteadyPace } from './steady-pace';
import type { WorkloadBounds } from './workload';

const h = (hours: number, minutes = 0): Duration => Duration.ofHours(hours, minutes);

/** Bornes d'une journée : minimum, maximum et temps attendu (7h). */
const day = (minimum: Duration, maximum: Duration): WorkloadBounds => ({
  minimum,
  maximum,
  expected: h(7),
});

// Semaine de La Brosse et Dupont : 5h–10h du lundi au jeudi, 4h30–9h15 le vendredi.
const WEEK: readonly WorkloadBounds[] = [
  day(h(5), h(10)),
  day(h(5), h(10)),
  day(h(5), h(10)),
  day(h(5), h(10)),
  day(h(4, 30), h(9, 15)),
];

const distribute = (pace: PaceStrategy, target: Duration): string[] =>
  pace.distribute(target, WEEK).map(({ worked }) => worked.format());

describe('Rythmes de répartition', () => {
  describe('rapide : les heures en plus le plus tôt possible', () => {
    const fast = new FastPace();

    it('remplit lundi au maximum puis mardi, les autres jours restent à 7h (39h)', () => {
      expect(distribute(fast, h(39))).toEqual(['10h', '8h', '7h', '7h', '7h']);
    });

    it('enchaîne les journées maximales tant qu’il le faut (45h)', () => {
      expect(distribute(fast, h(45))).toEqual(['10h', '10h', '10h', '8h', '7h']);
    });

    it('allège la fin de période quand l’objectif est sous 7h par jour (33h)', () => {
      expect(distribute(fast, h(33))).toEqual(['7h', '7h', '7h', '7h', '5h']);
    });
  });

  describe('au plus juste : 7h tant que possible, le surplus repoussé à la fin', () => {
    const late = new LatePace();

    it('remplit vendredi au maximum puis jeudi (39h)', () => {
      expect(distribute(late, h(39))).toEqual(['7h', '7h', '7h', '8h45', '9h15']);
    });

    it('allège le début de période quand l’objectif est sous 7h par jour (33h)', () => {
      expect(distribute(late, h(33))).toEqual(['5h', '7h', '7h', '7h', '7h']);
    });
  });

  describe('régulier : le même effort chaque jour', () => {
    it('répartit 39h en 5 journées de 7h48', () => {
      expect(distribute(new SteadyPace(), h(39))).toEqual(['7h48', '7h48', '7h48', '7h48', '7h48']);
    });
  });

  describe('règles communes à tous les rythmes', () => {
    const paces: readonly [string, PaceStrategy][] = [
      ['rapide', new FastPace()],
      ['régulier', new SteadyPace()],
      ['au plus juste', new LatePace()],
    ];

    it.each(paces)(
      '%s : la somme vaut exactement l’objectif et chaque jour reste dans ses bornes',
      (_, pace) => {
        const workloads = pace.distribute(h(41, 7), WEEK);
        const total = workloads.reduce((sum, { worked }) => sum.plus(worked), Duration.zero());

        expect(total.equals(h(41, 7))).toBe(true);
        workloads.forEach(({ item, worked }) => {
          expect(worked.isLessThan(item.minimum)).toBe(false);
          expect(worked.isGreaterThan(item.maximum)).toBe(false);
        });
      },
    );

    it.each(paces)('%s : refuse un objectif trop haut avec le manque exact', (_, pace) => {
      expect(() => pace.distribute(h(52), WEEK)).toThrow(ImpossiblePlanError);
      expect(() => pace.distribute(h(52), WEEK)).toThrow(/il manque 2h45/);
    });

    it.each(paces)('%s : refuse un objectif trop bas avec le minimum', (_, pace) => {
      expect(() => pace.distribute(h(20), WEEK)).toThrow(/minimum 24h30/);
    });
  });
});
