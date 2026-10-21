import { notificationUrl } from './notification-url';
import { RECOVERY_APPROVAL_ACTIONS } from './recovery-approval-category';
import { WEEK_CHECK_ACTIONS } from './week-check-category';

/**
 * Écran ouvert par chaque bouton. « Oui » en fin de semaine ramène à l'accueil (rien à corriger) ;
 * les boutons du suivi de la récup ouvrent l'écran de la récup, qui enregistre la réponse.
 */
const ACTION_TARGETS: Readonly<Record<string, string>> = {
  [WEEK_CHECK_ACTIONS.confirm]: '/',
  [RECOVERY_APPROVAL_ACTIONS.approved]: '/recup?answer=approved',
  [RECOVERY_APPROVAL_ACTIONS.refused]: '/recup?answer=refused',
  [RECOVERY_APPROVAL_ACTIONS.notYet]: '/recup?answer=not-yet',
};

/**
 * Écran à ouvrir après une réponse à une notification : le bouton touché décide,
 * sinon l'adresse rangée dans la notification (« Corriger », ou un simple toucher).
 * « Oui » à la question de fin de semaine n'enregistre rien : le plan est déjà considéré
 * comme suivi, il n'y a donc rien à corriger.
 *
 * @param actionIdentifier - Bouton touché (ou l'action par défaut quand on touche la notification)
 * @param data - Données de la notification
 * @returns L'adresse à ouvrir, ou `null` si la notification n'en désigne pas de valide
 */
export function notificationTarget(actionIdentifier: string, data: unknown): string | null {
  return ACTION_TARGETS[actionIdentifier] ?? notificationUrl(data);
}
