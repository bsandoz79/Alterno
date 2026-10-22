import { TimeOfDay, laBrosseEtDupontRules, TimeSlot, Duration } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { draggedTime, stretchRanges } from './time-drag';

const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
const range = { earliest: at('07:30'), latest: at('09:00') };

describe('draggedTime — heure suivie au doigt, à la minute près', () => {
  it('convertit le déplacement en minutes (1 point = 1 minute ici)', () => {
    expect(draggedTime(at('08:20'), -17, 1, range).format()).toBe('8h03');
    expect(draggedTime(at('08:20'), 23, 1, range).format()).toBe('8h43');
  });

  it('arrondit à la minute la plus proche selon l’échelle', () => {
    expect(draggedTime(at('08:00'), 10, 0.75, range).format()).toBe('8h13');
  });

  it('reste dans la plage autorisée', () => {
    expect(draggedTime(at('08:00'), -200, 1, range).format()).toBe('7h30');
    expect(draggedTime(at('08:00'), 200, 1, range).format()).toBe('9h00');
  });
});

describe('stretchRanges — jusqu’où étirer un bloc', () => {
  it('arrivée dans la plage d’arrivée, départ entre la fin de la plage fixe et le départ au plus tard', () => {
    const ranges = stretchRanges(laBrosseEtDupontRules(), {
      day: 'friday',
      arrival: at('08:20'),
      lunchBreak: TimeSlot.between(at('12:15'), at('13:00')),
      departure: at('15:30'),
      worked: Duration.ofHours(6, 25),
    });

    expect(ranges.arrival.earliest.format()).toBe('7h30');
    expect(ranges.arrival.latest.format()).toBe('9h00');
    expect(ranges.departure.earliest.format()).toBe('15h30');
    expect(ranges.departure.latest.format()).toBe('17h30');
  });
});
