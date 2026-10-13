import { useEffect } from 'react';
import { AppState } from 'react-native';

/**
 * Reprogramme les rappels au démarrage puis à chaque retour au premier plan :
 * la journée a pu avancer, ou le plan changer sur un autre écran.
 *
 * @param reschedule - Reprogrammation des rappels
 */
export function useRescheduleOnForeground(reschedule: () => Promise<unknown>): void {
  useEffect(() => {
    void reschedule();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void reschedule();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [reschedule]);
}
