import { ScreenContainer } from '@/shared/components/screen-container';
import { UpcomingCard } from '@/shared/components/upcoming-card';

/**
 * Écran « Semaine » : emploi du temps en grille, au format de l'EDT EPSI, sur plusieurs semaines.
 *
 * @returns L'écran
 */
export function WeekScreen() {
  return (
    <ScreenContainer title="Ma semaine">
      <UpcomingCard description="Ton emploi du temps en grille, sur plusieurs semaines, au format de l'EDT EPSI." />
    </ScreenContainer>
  );
}
