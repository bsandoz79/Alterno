import { ScreenContainer } from '@/shared/components/screen-container';
import { UpcomingCard } from '@/shared/components/upcoming-card';

/**
 * Écran « Compteur » : solde d'heures, bilan du vendredi, recalage sur Smart RH et historique.
 *
 * @returns L'écran
 */
export function CounterScreen() {
  return (
    <ScreenContainer title="Mon compteur">
      <UpcomingCard description="Ton solde d'heures, le bilan du vendredi, le recalage sur Smart RH et l'historique des semaines." />
    </ScreenContainer>
  );
}
