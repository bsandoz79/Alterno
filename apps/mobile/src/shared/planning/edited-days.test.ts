import { CalendarDate, TimeOfDay, TimeSlot } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { fixedDaysIn, setDayTimes, unlockDay } from './edited-days';

const monday = CalendarDate.fromIsoString('2026-10-26');
const tuesday = CalendarDate.fromIsoString('2026-10-27');
const times = (arrival: string, departure: string) => ({
  arrival: TimeOfDay.parse(arrival),
  lunchBreak: TimeSlot.between(TimeOfDay.parse('12:15'), TimeOfDay.parse('13:00')),
  departure: TimeOfDay.parse(departure),
});

describe('Jours aux horaires choisis (bloc étiré)', () => {
  it('retient les horaires choisis pour un jour, et les remplace au glissement suivant', () => {
    const once = setDayTimes({}, monday, times('08:00', '16:00'));
    const twice = setDayTimes(once, monday, times('08:17', '16:42'));

    expect(twice['2026-10-26']?.departure.format()).toBe('16h42');
    expect(Object.keys(twice)).toEqual(['2026-10-26']);
  });

  it('débloque un jour : il redevient réparti par le rythme', () => {
    const edits = setDayTimes(
      setDayTimes({}, monday, times('08:00', '16:00')),
      tuesday,
      times('08:00', '17:00'),
    );

    expect(Object.keys(unlockDay(edits, monday))).toEqual(['2026-10-27']);
  });

  it('ne garde que les jours de la période affichée, dans l’ordre de la période', () => {
    const edits = setDayTimes(
      setDayTimes({}, tuesday, times('08:00', '17:00')),
      monday,
      times('08:00', '16:00'),
    );

    expect(fixedDaysIn(edits, [monday]).map((day) => day.date.toIsoString())).toEqual([
      '2026-10-26',
    ]);
    expect(fixedDaysIn(edits, [monday, tuesday]).map((day) => day.departure.format())).toEqual([
      '16h00',
      '17h00',
    ]);
  });
});
