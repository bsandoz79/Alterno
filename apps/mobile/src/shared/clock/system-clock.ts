import { CalendarDate, TimeOfDay, type Clock } from '@alterno/engine';

/**
 * Horloge réelle de l'appareil, implémentation du port `Clock` du moteur.
 * Utilise la date et l'heure locales (fuseau du téléphone) : ce sont celles que l'utilisateur voit.
 */
export const systemClock: Clock = {
  today: () => {
    const now = new Date();
    return CalendarDate.of(now.getFullYear(), now.getMonth() + 1, now.getDate());
  },
  currentTime: () => {
    const now = new Date();
    return TimeOfDay.of(now.getHours(), now.getMinutes());
  },
};
