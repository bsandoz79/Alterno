import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../calendar/calendar-date';
import { Duration } from '../time/duration';
import type { ArchivedDay, ArchivedDayKind } from './archived-day';
import { summarizeHistory } from './history-summary';

const h = (hours: number, minutes = 0): Duration => Duration.ofHours(hours, minutes);
const day = (
  iso: string,
  kind: ArchivedDayKind,
  worked: Duration,
  expected = h(7),
): ArchivedDay => ({
  date: CalendarDate.fromIsoString(iso),
  kind,
  worked,
  expected,
});

const days: readonly ArchivedDay[] = [
  day('2026-09-28', 'work', h(7)),
  day('2026-09-30', 'work', h(8)),
  day('2026-10-01', 'work', h(8)),
  day('2026-10-02', 'recovery', h(0)),
  day('2026-10-05', 'school', h(0), h(0)),
  day('2026-10-06', 'half-recovery', h(3, 30)),
  day('2026-10-07', 'work', h(7, 30)),
];

describe('summarizeHistory — historique par mois et depuis le début du contrat', () => {
  it('résume chaque mois : fait, attendu, écart, jours travaillés, récups et école', () => {
    const { months } = summarizeHistory(days, null);
    const october = months.find((month) => month.month.month === 10);

    expect(months.map((month) => month.month.month)).toEqual([9, 10]);
    expect(october?.worked.format()).toBe('19h');
    expect(october?.expected.format()).toBe('28h');
    expect(october?.balance.format({ signed: true })).toBe('-9h');
    expect(october?.workedDays).toBe(2);
    expect(october?.recoveryDays).toBe(1.5);
    expect(october?.schoolDays).toBe(1);
  });

  it('cumule depuis le début du contrat, et donne le solde à la fin de chaque mois', () => {
    const { total, months } = summarizeHistory(days, null);

    expect(total.worked.format()).toBe('34h');
    expect(total.balance.format({ signed: true })).toBe('-8h');
    expect(total.recoveryDays).toBe(1.5);
    expect(months.map((month) => month.balanceAtEnd.format({ signed: true }))).toEqual([
      '+1h',
      '-8h',
    ]);
  });

  it('ignore les jours avant le début du contrat', () => {
    const { total, months } = summarizeHistory(days, CalendarDate.fromIsoString('2026-10-01'));

    expect(months).toHaveLength(1);
    expect(total.worked.format()).toBe('19h');
  });

  it('garde le détail jour par jour de chaque mois', () => {
    const { months } = summarizeHistory(days, null);

    expect(months[0]?.days.map((entry) => entry.date.toIsoString())).toEqual([
      '2026-09-28',
      '2026-09-30',
    ]);
  });

  it('historique vide : aucun mois, totaux à zéro', () => {
    const { total, months } = summarizeHistory([], null);

    expect(months).toEqual([]);
    expect(total.worked.isZero()).toBe(true);
  });

  it('remet les journées dans l’ordre des dates', () => {
    const { months } = summarizeHistory([...days].reverse(), null);

    expect(months[0]?.days[0]?.date.toIsoString()).toBe('2026-09-28');
  });
});
