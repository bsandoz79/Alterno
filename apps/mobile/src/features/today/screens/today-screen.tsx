import { ScreenContainer } from '@/shared/components/screen-container';
import { UpcomingCard } from '@/shared/components/upcoming-card';

/**
 * Écran « Aujourd'hui » : plan du jour, heure de départ prévue et bouton « Signaler un changement ».
 * Pour l'instant un écran d'attente : le contenu arrive avec les tickets du suivi réel.
 *
 * @returns L'écran
 */
export function TodayScreen() {
  return (
    <ScreenContainer title="Aujourd'hui">
      <UpcomingCard description="Ton plan du jour, ton heure de départ prévue et le bouton « Signaler un changement »." />
    </ScreenContainer>
  );
}
