import { Duration, TimeOfDay, TimeSlot } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { dayBlocks } from './day-blocks';

describe('dayBlocks — blocs d’une journée dans la grille', () => {
  it('découpe la journée en matin, pause et après-midi, positionnés en proportion de la grille', () => {
    const monday = {
      day: 'monday' as const,
      arrival: TimeOfDay.of(8, 0),
      lunchBreak: TimeSlot.between(TimeOfDay.of(12, 15), TimeOfDay.of(13, 0)),
      departure: TimeOfDay.of(16, 57),
      worked: Duration.ofHours(8, 12),
    };
    const blocks = dayBlocks(monday, { start: 8, end: 17 });

    expect(blocks.map((block) => block.kind)).toEqual(['work', 'lunch', 'work']);
    expect(blocks[0]).toMatchObject({ label: '8h00 – 12h15', top: 0 });
    expect(blocks[0]?.height).toBeCloseTo(4.25 / 9);
    expect(blocks[1]).toMatchObject({ label: '12h15 – 13h00' });
    expect(blocks[1]?.top).toBeCloseTo(4.25 / 9);
  });

  it('dessine un seul bloc, sans pause, pour une journée finie avant la pause', () => {
    const morningOnly = {
      day: 'thursday' as const,
      arrival: TimeOfDay.of(7, 30),
      lunchBreak: TimeSlot.between(TimeOfDay.of(12, 15), TimeOfDay.of(13, 0)),
      departure: TimeOfDay.of(9, 7),
      worked: Duration.ofHours(1, 37),
    };

    const blocks = dayBlocks(morningOnly, { start: 7, end: 10 });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: 'work', label: '7h30 – 9h07' });
    expect(blocks[0]?.top).toBeCloseTo(0.5 / 3);
    expect((blocks[0]?.top ?? 0) + (blocks[0]?.height ?? 0)).toBeLessThanOrEqual(1);
  });

  it('dessine un seul bloc pour une journée commencée après la pause', () => {
    const afternoonOnly = {
      day: 'monday' as const,
      arrival: TimeOfDay.of(14, 0),
      lunchBreak: TimeSlot.between(TimeOfDay.of(12, 0), TimeOfDay.of(12, 45)),
      departure: TimeOfDay.of(18, 0),
      worked: Duration.ofHours(4),
    };

    expect(dayBlocks(afternoonOnly, { start: 14, end: 18 }).map((block) => block.label)).toEqual([
      '14h00 – 18h00',
    ]);
  });
});
