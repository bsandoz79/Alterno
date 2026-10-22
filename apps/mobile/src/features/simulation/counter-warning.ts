import type { Duration, HoursCounter } from '@alterno/engine';

import type { ObjectiveKind } from './simulation-form';

/** Ce qu'il faut pour décider d'avertir : l'objectif choisi, l'effet du plan et le compteur. */
export interface CounterWarningInput {
  readonly objective: ObjectiveKind;
  /** Écart signé que le plan apporte au compteur. */
  readonly effect: Duration;
  readonly counter: HoursCounter;
  /** Objectif qui laisse le compteur inchangé, proposé par « Ajuster le plan ». */
  readonly targetWithoutLoss: Duration;
}

/** Avertissement affiché avant la validation. */
export interface CounterWarning {
  readonly text: string;
  /** Objectif à mettre si l'utilisateur choisit d'ajuster le plan. */
  readonly adjustedTarget: Duration;
}

/**
 * Avertit quand un objectif d'heures fait baisser le compteur, dès la moindre perte (ALT-68).
 * Une récup n'est pas concernée : elle retire des heures volontairement.
 *
 * @param input - Objectif, effet du plan, compteur et objectif sans perte
 * @returns L'avertissement, ou `null` si le compteur ne baisse pas
 */
export function counterWarning(input: CounterWarningInput): CounterWarning | null {
  if (input.objective !== 'hours' || !input.effect.isNegative()) {
    return null;
  }
  const after = input.counter.add(input.effect);
  return {
    text: `Ce plan retire ${input.effect.abs().format()} à ton compteur (${input.counter.format()} → ${after.format()}).`,
    adjustedTarget: input.targetWithoutLoss,
  };
}
