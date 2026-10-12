import { CalendarDate, type Clock } from '@alterno/engine';

/**
 * Horloge réelle de l'appareil, implémentation du port `Clock` du moteur.
 * Utilise la date locale (fuseau du téléphone) : c'est celle que l'utilisateur voit.
 */
export const systemClock: Clock = {
  today: () => {
    const now = new Date();
    return CalendarDate.of(now.getFullYear(), now.getMonth() + 1, now.getDate());
  },
};
