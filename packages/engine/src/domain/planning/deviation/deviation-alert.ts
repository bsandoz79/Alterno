/**
 * Type d'alerte levée après un écart :
 * - `day-gap` : la journée réelle diffère du plan ;
 * - `rule-violation` : la journée réelle enfreint une règle horaire (pause trop courte…) ;
 * - `target-out-of-reach` : l'objectif ne peut plus être atteint, même en journées maximales ;
 * - `target-exceeded` : l'objectif sera dépassé, même en journées minimales.
 */
export type DeviationAlertKind =
  'day-gap' | 'rule-violation' | 'target-out-of-reach' | 'target-exceeded';

/** Alerte affichée à l'utilisateur après la déclaration d'un écart. */
export interface DeviationAlert {
  /** Type d'alerte, pour que l'interface choisisse sa présentation (couleur, icône). */
  readonly kind: DeviationAlertKind;
  /** Message en français, prêt à afficher. */
  readonly message: string;
}
