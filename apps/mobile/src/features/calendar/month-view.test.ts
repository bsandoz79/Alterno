import {
  CalendarDate,
  Duration,
  HoursCounter,
  SimulatePlan,
  YearMonth,
  laBrosseEtDupontRules,
  type DatedPlan,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { buildMonth, monthOfWeek } from './month-view';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const simulate = new SimulatePlan(laBrosseEtDupontRules());

/** Plan à cheval sur septembre et octobre (28 septembre → 9 octobre), 82h : 8h12 par jour. */
const acrossMonths: DatedPlan = simulate.execute({
  days: [0, 1, 2, 3, 4, 7, 8, 9, 10, 11].map((offset) => date('2026-09-28').plusDays(offset)),
  objective: { kind: 'hours', target: Duration.ofHours(82) },
  pace: 'steady',
  counter: HoursCounter.zero(),
});

const isoMondays = (plan: DatedPlan, month: YearMonth): string[] =>
  buildMonth(plan, month).weeks.map((week) => week.monday.toIsoString());

describe('buildMonth — vue mois, du lundi au vendredi', () => {
  it('commence à la semaine du 1er, même si elle déborde sur le mois précédent', () => {
    // Le 1er octobre 2026 est un jeudi : la première ligne va du lundi 28 septembre au vendredi 2 octobre.
    expect(isoMondays(acrossMonths, YearMonth.of(2026, 10))).toEqual([
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ]);
  });

  it('ignore une semaine dont aucun jour ouvré n’est dans le mois', () => {
    // Le 1er août 2026 est un samedi : la semaine du 27 juillet n'a aucun jour ouvré en août.
    expect(isoMondays(acrossMonths, YearMonth.of(2026, 8))).toEqual([
      '2026-08-03',
      '2026-08-10',
      '2026-08-17',
      '2026-08-24',
      '2026-08-31',
    ]);
  });

  it('distingue les jours hors du mois et garde leur plan', () => {
    const firstRow = buildMonth(acrossMonths, YearMonth.of(2026, 10)).weeks[0];

    expect(firstRow?.cells.map((cell) => cell.inMonth)).toEqual([false, false, false, true, true]);
    expect(firstRow?.cells[0]?.day?.plan.worked.format()).toBe('8h12');
  });

  it('laisse vide un jour sans plan', () => {
    const lastRow = buildMonth(acrossMonths, YearMonth.of(2026, 10)).weeks.at(-1);

    expect(lastRow?.cells.every((cell) => cell.day === null)).toBe(true);
  });

  it('ne compte dans le total que les jours du mois', () => {
    // 7 jours d'octobre planifiés (1er, 2, puis 5 → 9) à 8h12 : 57h24.
    expect(buildMonth(acrossMonths, YearMonth.of(2026, 10)).total.format()).toBe('57h24');
  });
});

describe('monthOfWeek — mois à ouvrir depuis la semaine affichée', () => {
  it('rattache la semaine au mois de son jeudi', () => {
    expect(monthOfWeek(date('2026-09-28')).equals(YearMonth.of(2026, 10))).toBe(true);
    expect(monthOfWeek(date('2026-10-26')).equals(YearMonth.of(2026, 10))).toBe(true);
    expect(monthOfWeek(date('2026-11-30')).equals(YearMonth.of(2026, 12))).toBe(true);
  });
});
