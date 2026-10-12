import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/shared/components/screen-container';
import { UpcomingCard } from '@/shared/components/upcoming-card';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/**
 * Écran « Compteur » : solde d'heures, bilan du vendredi, recalage sur Smart RH et historique.
 * Donne aussi accès aux réglages des règles horaires.
 *
 * @returns L'écran
 */
export function CounterScreen() {
  return (
    <ScreenContainer title="Mon compteur">
      <UpcomingCard description="Ton solde d'heures, le bilan du vendredi, le recalage sur Smart RH et l'historique des semaines." />
      <Link href="/reglages" style={styles.settingsLink} accessibilityRole="button">
        <Text style={styles.settingsTitle}>Règles horaires</Text>
        {'\n'}
        <Text style={styles.settingsHint}>Plages, pause minimale, temps attendu et récups</Text>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  settingsLink: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
  },
  settingsTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.primary,
  },
  settingsHint: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
