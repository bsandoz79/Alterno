import { notificationUrl } from './notification-url';
import { WEEK_CHECK_ACTIONS } from './week-check-category';

/** Accueil de l'app, ouvert quand il n'y a rien à corriger. */
const HOME = '/';

/**
 * Écran à ouvrir après une réponse à une notification : le bouton touché décide,
 * sinon l'adresse rangée dans la notification.
 * « Oui » à la question de fin de semaine n'enregistre rien : le plan est déjà considéré
 * comme suivi, il n'y a donc rien à corriger.
 *
 * @param actionIdentifier - Bouton touché (ou l'action par défaut quand on touche la notification)
 * @param data - Données de la notification
 * @returns L'adresse à ouvrir, ou `null` si la notification n'en désigne pas de valide
 */
export function notificationTarget(actionIdentifier: string, data: unknown): string | null {
  return actionIdentifier === WEEK_CHECK_ACTIONS.confirm ? HOME : notificationUrl(data);
}
