import {
  CalendarDate,
  HoursCounter,
  SimulatePlan,
  laBrosseEtDupontRules,
  Duration,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { paceShapes } from './pace-shapes';

const days = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'].map((iso) =>
  CalendarDate.fromIsoString(iso),
);
const comparison = new SimulatePlan(laBrosseEtDupontRules()).compare({
  days,
  objective: { kind: 'hours', target: Duration.ofHours(39) },
  counter: HoursCounter.zero(),
});

describe('paceShapes — graphiques des cartes de rythme', () => {
  it('donne une barre par jour, la plus longue journée de tous les rythmes valant 1', () => {
    const shapes = paceShapes(comparison);

    expect(shapes.fast).toHaveLength(5);
    expect(Math.max(...shapes.fast, ...shapes.steady, ...shapes.late)).toBe(1);
    expect(shapes.fast[0]).toBe(1);
  });

  it('garde les proportions : 7h vaut 0,7 d’une journée de 10h', () => {
    expect(paceShapes(comparison).fast[4]).toBeCloseTo(0.7);
  });

  it('dessine le rythme régulier tout plat', () => {
    const steady = paceShapes(comparison).steady;

    expect(new Set(steady).size).toBe(1);
  });
});
