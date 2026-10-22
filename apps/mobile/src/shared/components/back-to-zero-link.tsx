import type { HoursCounter } from '@alterno/engine';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BACK_TO_ZERO_PARAM, needsBackToZero } from '@/shared/planning/back-to-zero';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/**
 * Accès rapide quand le compteur est négatif : ouvre la simulation avec l'objectif « Revenir à 0 »
 * déjà choisi (1 semaine par défaut ; 2 semaines se choisissent dans la simulation).
 *
 * @param props - Compteur actuel (rien n'est affiché s'il n'est pas négatif, ou pas encore chargé)
 * @returns La carte, ou rien
 */
export function BackToZeroLink({ counter }: { readonly counter: HoursCounter | null }) {
  if (counter === null || !needsBackToZero(counter)) {
    return null;
  }
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{`Compteur à ${counter.format()}.`}</Text>
      <Link
        href={{ pathname: '/simulation', params: { objectif: BACK_TO_ZERO_PARAM } }}
        style={styles.link}
        accessibilityRole="button"
      >
        Faire un plan pour revenir à 0
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  text: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.text,
  },
  link: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.primary,
  },
});
