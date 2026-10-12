import { describe, expect, it } from 'vitest';

import { CalendarDate } from './calendar-date';
import { SchoolWeeks } from './school-weeks';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const isoMondays = (weeks: SchoolWeeks): string[] =>
  weeks.mondays().map((monday) => monday.toIsoString());

describe('SchoolWeeks — semaines d’école marquées par l’utilisateur', () => {
  it('ne contient aucune semaine par défaut', () => {
    expect(SchoolWeeks.none().mondays()).toEqual([]);
    expect(SchoolWeeks.none().contains(date('2026-10-19'))).toBe(false);
  });

  it('range chaque date sous le lundi de sa semaine, sans doublon et dans l’ordre', () => {
    const weeks = SchoolWeeks.of([date('2026-11-04'), date('2026-10-21'), date('2026-11-02')]);

    expect(isoMondays(weeks)).toEqual(['2026-10-19', '2026-11-02']);
  });

  it('reconnaît tous les jours d’une semaine marquée, week-end compris', () => {
    const weeks = SchoolWeeks.of([date('2026-10-19')]);

    expect(weeks.contains(date('2026-10-19'))).toBe(true);
    expect(weeks.contains(date('2026-10-23'))).toBe(true);
    expect(weeks.contains(date('2026-10-25'))).toBe(true);
    expect(weeks.contains(date('2026-10-26'))).toBe(false);
  });

  it('marque puis démarque une semaine sans modifier l’original (objet immuable)', () => {
    const original = SchoolWeeks.none();
    const marked = original.toggle(date('2026-10-21'));
    const unmarked = marked.toggle(date('2026-10-19'));

    expect(isoMondays(original)).toEqual([]);
    expect(isoMondays(marked)).toEqual(['2026-10-19']);
    expect(isoMondays(unmarked)).toEqual([]);
  });
});
