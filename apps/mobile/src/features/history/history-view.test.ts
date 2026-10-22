import { CalendarDate, Duration, YearMonth, type MonthSummary } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { balanceBars, dayLine, recoveryLabel } from './history-view';

const h = (hours: number): Duration => Duration.ofHours(hours);
const month = (m: number, balanceAtEnd: Duration): MonthSummary => ({
  month: YearMonth.of(2026, m),
  worked: h(0),
  expected: h(0),
  balance: h(0),
  workedDays: 0,
  recoveryDays: 0,
  schoolDays: 0,
  balanceAtEnd,
  days: [],
});

describe('Vue de l’historique', () => {
  it('barres du solde : hauteur relative au plus grand écart, sens selon le signe', () => {
    const bars = balanceBars([month(9, h(2)), month(10, h(-4))]);

    expect(bars.map((bar) => [bar.ratio, bar.positive])).toEqual([
      [0.5, true],
      [1, false],
    ]);
  });

  it('barres à plat quand rien n’a bougé', () => {
    expect(balanceBars([month(9, Duration.zero())])[0]?.ratio).toBe(0);
  });

  it('récups en journées : « 1,5 j » ; rien s’il n’y en a pas', () => {
    expect(recoveryLabel(1.5)).toBe('1,5 j');
    expect(recoveryLabel(0)).toBe('—');
  });

  it('ligne d’un jour : horaires et écart, ou type de journée', () => {
    expect(
      dayLine({
        date: CalendarDate.fromIsoString('2026-10-19'),
        kind: 'work',
        worked: Duration.ofHours(8, 12),
        expected: h(7),
      }),
    ).toBe('8h12 (+1h12)');
    expect(
      dayLine({
        date: CalendarDate.fromIsoString('2026-10-23'),
        kind: 'recovery',
        worked: h(0),
        expected: h(7),
      }),
    ).toBe('Récup (-7h)');
    expect(
      dayLine({
        date: CalendarDate.fromIsoString('2026-10-26'),
        kind: 'school',
        worked: h(0),
        expected: h(0),
      }),
    ).toBe('École');
  });
});
