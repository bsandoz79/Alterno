/**
 * Catégorie de notification de la question « Ta récup a-t-elle été acceptée ? » : elle ajoute
 * les boutons « Oui », « Non » et « Pas encore ». Pas de « - » ni de « : » dans l'identifiant.
 */
export const RECOVERY_APPROVAL_CATEGORY = 'recoveryapproval';

/** Identifiants des boutons de la question de suivi de la récup. */
export const RECOVERY_APPROVAL_ACTIONS = {
  /** « Oui » : la récup a été acceptée. */
  approved: 'recovery_yes',
  /** « Non » : la récup a été refusée. */
  refused: 'recovery_no',
  /** « Pas encore » : pas de réponse de l'entreprise, on redemandera. */
  notYet: 'recovery_later',
} as const;
