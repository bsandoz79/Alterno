import { ScreenContainer } from '@/shared/components/screen-container';
import { UpcomingCard } from '@/shared/components/upcoming-card';

/**
 * Écran « Simulation » : période, objectif (heures ou récup) et rythme, puis le plan proposé.
 *
 * @returns L'écran
 */
export function SimulationScreen() {
  return (
    <ScreenContainer title="Simulation">
      <UpcomingCard description="Choisis une période, un objectif d'heures ou une date de récup, et ton rythme : Alterno calcule tes horaires." />
    </ScreenContainer>
  );
}
