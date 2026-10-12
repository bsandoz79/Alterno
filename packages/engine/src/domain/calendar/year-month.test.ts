import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { CalendarDate } from './calendar-date';
import { YearMonth } from './year-month';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);

describe('YearMonth — un mois du calendrier', () => {
  it('retrouve le mois d’une date', () => {
    const month = YearMonth.containing(date('2026-10-12'));

    expect([month.year, month.month]).toEqual([2026, 10]);
  });

  it('donne le premier et le dernier jour du mois', () => {
    const october = YearMonth.of(2026, 10);

    expect(october.firstDay().toIsoString()).toBe('2026-10-01');
    expect(october.lastDay().toIsoString()).toBe('2026-10-31');
  });

  it('connaît le 29 février des années bissextiles', () => {
    expect(YearMonth.of(2028, 2).lastDay().toIsoString()).toBe('2028-02-29');
    expect(YearMonth.of(2027, 2).lastDay().toIsoString()).toBe('2027-02-28');
  });

  it('avance et recule de plusieurs mois, y compris en changeant d’année', () => {
    expect(YearMonth.of(2026, 12).plusMonths(1).equals(YearMonth.of(2027, 1))).toBe(true);
    expect(YearMonth.of(2027, 1).plusMonths(-1).equals(YearMonth.of(2026, 12))).toBe(true);
    expect(YearMonth.of(2026, 10).plusMonths(-22).equals(YearMonth.of(2024, 12))).toBe(true);
  });

  it('sait si une date tombe dans le mois', () => {
    const october = YearMonth.of(2026, 10);

    expect(october.contains(date('2026-10-01'))).toBe(true);
    expect(october.contains(date('2026-10-31'))).toBe(true);
    expect(october.contains(date('2026-09-30'))).toBe(false);
    expect(october.contains(date('2027-10-15'))).toBe(false);
  });

  it('distingue deux mois de même numéro mais d’années différentes', () => {
    expect(YearMonth.of(2026, 10).equals(YearMonth.of(2027, 10))).toBe(false);
  });

  it.each([
    [2026, 0],
    [2026, 13],
    [2026, 1.5],
    [2026.5, 3],
  ])('refuse un mois inexistant (%d, mois %d)', (year, month) => {
    expect(() => YearMonth.of(year, month)).toThrow(InvalidValueError);
  });
});
