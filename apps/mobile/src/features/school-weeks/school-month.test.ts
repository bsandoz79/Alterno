import { CalendarDate, SchoolWeeks, YearMonth } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { schoolMonthRows } from './school-month';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);

describe('schoolMonthRows — lignes du calendrier de marquage des semaines d’école', () => {
  const october = YearMonth.of(2026, 10);
  const rows = schoolMonthRows(october, SchoolWeeks.of([date('2026-10-19')]));

  it('affiche une ligne par semaine ouvrée du mois, du lundi au vendredi', () => {
    expect(rows.map((row) => row.monday.toIsoString())).toEqual([
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ]);
    expect(rows[0]?.days.map((day) => day.date.day)).toEqual([28, 29, 30, 1, 2]);
    expect(rows[0]?.days.map((day) => day.inMonth)).toEqual([false, false, false, true, true]);
  });

  it('indique les semaines marquées « école »', () => {
    expect(rows.map((row) => row.school)).toEqual([false, false, false, true, false]);
  });
});
