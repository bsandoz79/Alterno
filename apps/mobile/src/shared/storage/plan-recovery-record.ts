import {
  CalendarDate,
  TimeOfDay,
  type DatedPlan,
  type PlannedRecovery,
  type RecoveryApproval,
  type RecoveryApprovalStatus,
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
  /** Suivi de la demande (`pending`, `approved`, `refused`) ; absent avant ALT-55. */
  readonly approvalStatus?: string | null;
  /** Jour de la demande « AAAA-MM-JJ ». */
  readonly requestedOn?: string | null;
  /** Heure de la demande, en minutes depuis minuit. */
  readonly requestedAtMinutes?: number | null;
}

const RECOVERY_KINDS: readonly RecoveryKind[] = ['full', 'half'];
const RECOVERY_PARTS: readonly RecoveryPart[] = ['morning', 'afternoon'];
const APPROVAL_STATUSES: readonly RecoveryApprovalStatus[] = ['pending', 'approved', 'refused'];
const MINUTES_PER_HOUR = 60;

/**
 * Convertit la récup du plan en données brutes.
 *
 * @param recovery - Récup prévue
 * @returns Ses données à enregistrer
 */
export function toPlanRecoveryRecord(recovery: PlannedRecovery): PlanRecoveryRecord {
  const { approval } = recovery;
  return {
    date: recovery.date.toIsoString(),
    kind: recovery.kind,
    part: recovery.part ?? null,
    approvalStatus: approval?.status ?? null,
    requestedOn: approval?.requestedOn.toIsoString() ?? null,
    requestedAtMinutes: approval?.requestedAt.toMinutesSinceMidnight() ?? null,
  };
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
  const approval = approvalOf(record);
  return {
    ...plan,
    recovery: {
      date,
      kind,
      ...(part === undefined ? {} : { part }),
      ...(approval === null ? {} : { approval }),
    },
  };
}

/**
 * Suivi de la demande enregistré ; incomplet ou illisible, il est ignoré (aucune question posée)
 * plutôt que de mettre l'écran en erreur.
 */
function approvalOf(record: PlanRecoveryRecord): RecoveryApproval | null {
  const status = APPROVAL_STATUSES.find((candidate) => candidate === record.approvalStatus);
  const { requestedOn, requestedAtMinutes } = record;
  if (
    status === undefined ||
    typeof requestedOn !== 'string' ||
    typeof requestedAtMinutes !== 'number'
  ) {
    return null;
  }
  return {
    status,
    requestedOn: CalendarDate.fromIsoString(requestedOn),
    requestedAt: TimeOfDay.of(
      Math.floor(requestedAtMinutes / MINUTES_PER_HOUR),
      requestedAtMinutes % MINUTES_PER_HOUR,
    ),
  };
}
