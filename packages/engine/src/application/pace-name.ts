import { FastPace } from '../domain/planning/pace/fast-pace';
import { LatePace } from '../domain/planning/pace/late-pace';
import type { PaceStrategy } from '../domain/planning/pace/pace-strategy';
import { SteadyPace } from '../domain/planning/pace/steady-pace';

/** Nom d'un rythme, tel que choisi à l'écran. */
export type PaceName = 'fast' | 'steady' | 'late';

const PACES: Readonly<Record<PaceName, PaceStrategy>> = {
  fast: new FastPace(),
  steady: new SteadyPace(),
  late: new LatePace(),
};

/**
 * Traduit le nom choisi à l'écran en stratégie du domaine.
 * Partagé par les cas d'usage (simulation, déclaration d'écart) pour qu'un nom désigne partout le même rythme.
 *
 * @param name - Nom du rythme
 * @returns La stratégie correspondante
 */
export function paceStrategy(name: PaceName): PaceStrategy {
  return PACES[name];
}
