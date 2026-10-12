import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { CalendarDate } from './calendar-date';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);

describe('CalendarDate — date du calendrier, sans heure', () => {
  it('connaît le jour de la semaine', () => {
    expect(CalendarDate.of(2026, 10, 12).weekday()).toBe('monday');
    expect(date('2026-10-18').weekday()).toBe('sunday');
  });

  it('avance de plusieurs jours, y compris en changeant de mois et d’année', () => {
    expect(date('2026-10-30').plusDays(3).toIsoString()).toBe('2026-11-02');
    expect(date('2026-12-31').plusDays(1).toIsoString()).toBe('2027-01-01');
  });

  it('retrouve le lundi de sa semaine (la semaine commence le lundi)', () => {
    expect(date('2026-10-15').startOfWeek().toIsoString()).toBe('2026-10-12');
    expect(date('2026-10-18').startOfWeek().toIsoString()).toBe('2026-10-12');
    expect(date('2026-10-12').startOfWeek().toIsoString()).toBe('2026-10-12');
  });

  it('compare deux dates', () => {
    expect(date('2026-10-12').isBefore(date('2026-10-13'))).toBe(true);
    expect(date('2026-10-13').isBefore(date('2026-10-13'))).toBe(false);
    expect(date('2026-10-13').equals(date('2026-10-13'))).toBe(true);
  });

  it('expose l’année, le mois et le jour', () => {
    const value = date('2026-02-28');

    expect([value.year, value.month, value.day]).toEqual([2026, 2, 28]);
  });

  it.each([
    [2026, 2, 30],
    [2026, 13, 1],
    [2026, 0, 10],
    [2026, 4, 31],
  ])('refuse la date inexistante %i-%i-%i', (year, month, day) => {
    expect(() => CalendarDate.of(year, month, day)).toThrow(InvalidValueError);
  });

  it('refuse une date au mauvais format', () => {
    expect(() => CalendarDate.fromIsoString('12/10/2026')).toThrow(InvalidValueError);
  });
});
