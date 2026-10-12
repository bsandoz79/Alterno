import type { PaceComparison, PaceName } from '@alterno/engine';

const PACE_NAMES: readonly PaceName[] = ['fast', 'steady', 'late'];

/** Hauteurs relatives des barres de chaque rythme (une barre par jour, entre 0 et 1). */
export type PaceShapes = Readonly<Record<PaceName, readonly number[]>>;

/**
 * Graphiques des cartes de rythme, calculés à partir des vraies simulations.
 * Les trois rythmes partagent la même échelle (la plus longue journée vaut 1) : on peut les comparer d'un coup d'œil.
 *
 * @param comparison - Simulation de chaque rythme pour le même objectif
 * @returns Les hauteurs des barres de chaque rythme
 */
export function paceShapes(comparison: PaceComparison): PaceShapes {
  const workedOf = (pace: PaceName): number[] =>
    comparison[pace].days.map((day) => day.plan.worked.toMinutes());
  const longest = Math.max(...PACE_NAMES.flatMap(workedOf));
  const shapeOf = (pace: PaceName): number[] => workedOf(pace).map((minutes) => minutes / longest);
  return { fast: shapeOf('fast'), steady: shapeOf('steady'), late: shapeOf('late') };
}
