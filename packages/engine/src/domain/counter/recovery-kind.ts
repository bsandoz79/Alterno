/** Type de récupération : une journée entière ou une demi-journée. */
export type RecoveryKind = 'full' | 'half';

/** Libellés français des récupérations, utilisés dans les messages d'erreur. */
export const RECOVERY_LABELS: Readonly<Record<RecoveryKind, string>> = {
  full: 'une journée de récup',
  half: 'une demi-journée de récup',
};
