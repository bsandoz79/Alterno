/**
 * Catégorie de notification de la question de fin de semaine : elle ajoute les boutons
 * « Oui » et « Corriger ». expo-notifications déconseille « - » et « : » dans cet identifiant.
 */
export const WEEK_CHECK_CATEGORY = 'weekcheck';

/** Identifiants des boutons de la question de fin de semaine, renvoyés quand on en touche un. */
export const WEEK_CHECK_ACTIONS = {
  /** « Oui » : la semaine s'est passée comme prévu, rien à déclarer (le plan est considéré comme suivi). */
  confirm: 'weekcheck_yes',
  /** « Corriger » : ouvre la semaine pour signaler les écarts. */
  correct: 'weekcheck_correct',
} as const;
