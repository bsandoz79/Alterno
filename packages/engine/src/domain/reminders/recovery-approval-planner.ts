import type { DatedPlan } from '../planning/dated-plan';
import { isUpcoming, type Moment } from './departure-reminder-planner';
import type { ReminderSettings } from './reminder-settings';
import type { RecoveryApprovalQuestion } from './scheduled-reminder';

/**
 * Calcule les questions « Ta récup a-t-elle été acceptée ? » d'une demande en cours :
 * une première après le délai réglé (2 jours par défaut), à l'heure de la demande,
 * puis une relance à intervalle régulier (chaque jour par défaut) jusqu'à la veille de la récup.
 * Une réponse (acceptée ou refusée) arrête les questions ; seules celles encore à venir sont gardées.
 */
export class RecoveryApprovalPlanner {
  /**
   * @param plan - Plan en cours
   * @param moment - Date et heure actuelles (fournies par l'horloge)
   * @param settings - Réglage des notifications (suivi activé, délais)
   * @returns Les questions à venir, dans l'ordre
   */
  questionsFor(
    plan: DatedPlan,
    moment: Moment,
    settings: ReminderSettings,
  ): readonly RecoveryApprovalQuestion[] {
    const recovery = plan.recovery;
    const approval = recovery?.approval;
    if (!settings.approvalCheck || recovery === undefined || approval?.status !== 'pending') {
      return [];
    }
    const questions: RecoveryApprovalQuestion[] = [];
    // Jusqu'à la veille de la récup : le jour même, la question n'a plus d'intérêt.
    for (
      let date = approval.requestedOn.plusDays(settings.approvalFirstDelayDays);
      date.isBefore(recovery.date);
      date = date.plusDays(settings.approvalRepeatDays)
    ) {
      questions.push({
        kind: 'recovery-approval',
        date,
        at: approval.requestedAt,
        recoveryDate: recovery.date,
      });
    }
    return questions.filter((question) => isUpcoming(question, moment));
  }
}
