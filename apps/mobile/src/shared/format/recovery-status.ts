import type { PlannedRecovery, RecoveryApprovalStatus } from '@alterno/engine';

import { formatShortDate } from './format-date';

/** Libellé de chaque état de la demande, tel qu'affiché après la date. */
const STATUS_LABELS: Readonly<Record<RecoveryApprovalStatus, string>> = {
  pending: 'demande en cours',
  approved: 'acceptée',
  refused: 'refusée',
};

/**
 * Ligne de statut de la récup, affichée sur la semaine et l'accueil.
 *
 * @param recovery - Récup posée par le plan
 * @returns « Repos compensatoire du ven. 30 oct. : demande en cours », ou `null` sans suivi
 */
export function recoveryStatusText(recovery: PlannedRecovery): string | null {
  if (recovery.approval === undefined) {
    return null;
  }
  return `Repos compensatoire du ${formatShortDate(recovery.date)} : ${STATUS_LABELS[recovery.approval.status]}`;
}
