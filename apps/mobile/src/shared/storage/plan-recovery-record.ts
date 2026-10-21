import {
  CalendarDate,
  type DatedPlan,
  type PlannedRecovery,
  type RecoveryKind,
  type RecoveryPart,
} from '@alterno/engine';

/**
 * Récup du plan sous forme de données brutes : date « AAAA-MM-JJ », type (`full` ou `half`)
 * et, pour une demi-journée, la moitié en repos (`morning` ou `afternoon`).
 */
export interface PlanRecoveryRecord {
  readonly date: string;
  readonly kind: string;
  /** Absente des récups enregistrées avant ALT-56. */
  readonly part?: string | null;
}

const RECOVERY_KINDS: readonly RecoveryKind[] = ['full', 'half'];
const RECOVERY_PARTS: readonly RecoveryPart[] = ['morning', 'afternoon'];

/**
 * Convertit la récup du plan en données brutes.
 *
 * @param recovery - Récup prévue
 * @returns Ses données à enregistrer
 */
export function toPlanRecoveryRecord(recovery: PlannedRecovery): PlanRecoveryRecord {
  return { date: recovery.date.toIsoString(), kind: recovery.kind, part: recovery.part ?? null };
}

/**
 * Rattache au plan relu la récup enregistrée.
 * Un type inconnu (donnée corrompue) est ignoré : mieux vaut un solde à venir sans récup qu'un écran en erreur.
 *
 * @param plan - Plan relu (journées)
 * @param record - Récup enregistrée, ou `null` si le plan n'en prépare pas
 * @returns Le plan, avec sa récup si elle est lisible
 * @throws {InvalidValueError} Si la date enregistrée est invalide
 */
export function withPlanRecovery(plan: DatedPlan, record: PlanRecoveryRecord | null): DatedPlan {
  const kind = RECOVERY_KINDS.find((candidate) => candidate === record?.kind);
  if (record === null || kind === undefined) {
    return plan;
  }
  // Une moitié absente ou illisible n'est pas gardée : l'après-midi s'applique alors par défaut.
  const part = RECOVERY_PARTS.find((candidate) => candidate === record.part);
  const date = CalendarDate.fromIsoString(record.date);
  return {
    ...plan,
    recovery: part === undefined ? { date, kind } : { date, kind, part },
  };
}
