import { describe, expect, it } from 'vitest';

import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import { dayProgress, type DayProgress } from './day-progress';
import type { DayPlan } from './plan';

const at = (value: string): TimeOfDay => TimeOfDay.parse(value);

/** Journée de test : 8h15 → 16h00, pause 12h15–13h00, 7h travaillées. */
const day: DayPlan = {
  day: 'wednesday',
  arrival: at('08:15'),
  lunchBreak: TimeSlot.between(at('12:15'), at('13:00')),
  departure: at('16:00'),
  worked: Duration.ofHours(7),
};

/** Résumé lisible de l'avancement. */
const describeProgress = (progress: DayProgress): string => {
  switch (progress.kind) {
    case 'before-start':
      return `avant ${progress.arrival.format()}, ${progress.remaining.format()} à faire`;
    case 'working':
      return `reste ${progress.remaining.format()}, départ ${progress.departure.format()}`;
    case 'lunch':
      return `pause jusqu’à ${progress.lunchEnd.format()}, reste ${progress.remaining.format()}`;
    case 'overtime':
      return `départ ${progress.departure.format()} dépassé de ${progress.beyond.format()}`;
  }
};

describe('dayProgress — temps restant à travailler aujourd’hui', () => {
  it('avant l’arrivée : toute la journée reste à faire', () => {
    expect(describeProgress(dayProgress(day, at('07:50')))).toBe('avant 8h15, 7h à faire');
  });

  it('le matin : le temps restant ne compte pas la pause (14h00 → 16h00 et 10h00 → 5h15)', () => {
    expect(describeProgress(dayProgress(day, at('10:00')))).toBe('reste 5h15, départ 16h00');
    expect(describeProgress(dayProgress(day, at('14:00')))).toBe('reste 2h, départ 16h00');
  });

  it('pendant la pause : annonce la fin de la pause, et ce qui reste ensuite', () => {
    expect(describeProgress(dayProgress(day, at('12:30')))).toBe('pause jusqu’à 13h00, reste 3h');
  });

  it('cas limite : à la minute du départ, c’est l’heure de partir (dépassé de 0h)', () => {
    expect(describeProgress(dayProgress(day, at('16:00')))).toBe('départ 16h00 dépassé de 0h');
  });

  it('après le départ prévu : dit de combien il est dépassé', () => {
    expect(describeProgress(dayProgress(day, at('16:12')))).toBe('départ 16h00 dépassé de 0h12');
  });

  it('cas limite : journée sans pause (départ avant midi), tout le temps compte', () => {
    const morning: DayPlan = {
      ...day,
      arrival: at('07:30'),
      departure: at('09:07'),
      worked: Duration.ofMinutes(97),
    };

    expect(describeProgress(dayProgress(morning, at('08:00')))).toBe('reste 1h07, départ 9h07');
  });

  it('cas limite : pause plus courte que les 45 min déduites, le temps restant n’est jamais négatif', () => {
    const shortLunch: DayPlan = {
      ...day,
      lunchBreak: TimeSlot.between(at('12:15'), at('12:30')),
    };

    expect(describeProgress(dayProgress(shortLunch, at('15:50')))).toBe('reste 0h, départ 16h00');
  });
});
