import type { HoursCounter } from '@alterno/engine';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/**
 * Carte du solde : vert quand le compteur est créditeur (heures d'avance), rouge quand il est
 * débiteur (heures à rattraper), neutre à l'équilibre.
 *
 * @param props - Compteur actuel
 * @returns La carte
 */
export function BalanceCard({ counter }: { readonly counter: HoursCounter }) {
  const negative = counter.balance.isNegative();
  const even = counter.balance.isZero();
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Solde du compteur</Text>
      <Text
        style={[styles.balance, even ? styles.even : negative ? styles.negative : styles.positive]}
        accessibilityRole="header"
      >
        {counter.format()}
      </Text>
      <Text style={styles.hint}>
        {even
          ? 'Compteur à l’équilibre'
          : negative
            ? 'Heures à rattraper'
            : 'Heures d’avance, utilisables pour une récup'}
      </Text>
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
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  balance: {
    fontFamily: FONTS.extraBold,
    fontSize: 48,
    lineHeight: 56,
  },
  even: {
    color: COLORS.text,
  },
  positive: {
    color: COLORS.positive,
  },
  negative: {
    color: COLORS.primary,
  },
  hint: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
