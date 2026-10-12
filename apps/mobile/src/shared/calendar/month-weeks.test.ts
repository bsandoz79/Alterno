import { YearMonth } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { monthWeekMondays } from './month-weeks';

const isoMondays = (month: YearMonth): string[] =>
  monthWeekMondays(month).map((monday) => monday.toIsoString());

describe('monthWeekMondays — semaines ouvrées d’un mois (lignes d’un calendrier sans week-end)', () => {
  it('commence à la semaine du 1er, même si elle déborde sur le mois précédent', () => {
    // Le 1er octobre 2026 est un jeudi.
    expect(isoMondays(YearMonth.of(2026, 10))).toEqual([
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ]);
  });

  it('ignore une semaine dont aucun jour ouvré n’est dans le mois', () => {
    // Le 1er août 2026 est un samedi : la semaine du 27 juillet n'a aucun jour ouvré en août.
    expect(isoMondays(YearMonth.of(2026, 8))[0]).toBe('2026-08-03');
  });
});
