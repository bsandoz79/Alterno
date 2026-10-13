import {
  CalendarDate,
  type DatedPlan,
  type PlannedRecovery,
  type RecoveryKind,
} from '@alterno/engine';

/** Récup du plan sous forme de données brutes : date « AAAA-MM-JJ » et type (`full` ou `half`). */
export interface PlanRecoveryRecord {
  readonly date: string;
  readonly kind: string;
}

const RECOVERY_KINDS: readonly RecoveryKind[] = ['full', 'half'];

/**
 * Convertit la récup du plan en données brutes.
 *
 * @param recovery - Récup prévue
 * @returns Ses données à enregistrer
 */
export function toPlanRecoveryRecord(recovery: PlannedRecovery): PlanRecoveryRecord {
  return { date: recovery.date.toIsoString(), kind: recovery.kind };
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
  return { ...plan, recovery: { date: CalendarDate.fromIsoString(record.date), kind } };
}
