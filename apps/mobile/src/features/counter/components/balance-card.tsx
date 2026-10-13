import type { HoursCounter } from '@alterno/engine';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import type { BalanceStatus } from '../balance-status';

/** Propriétés de la carte du solde. */
interface BalanceCardProps {
  readonly counter: HoursCounter;
  readonly status: BalanceStatus;
}

/**
 * Carte du solde : vert quand le compteur est créditeur (heures d'avance), rouge quand il est
 * débiteur (heures à rattraper), neutre à l'équilibre. Au-delà du découvert autorisé,
 * l'explication passe en alerte.
 *
 * @param props - Compteur actuel et son état
 * @returns La carte
 */
export function BalanceCard({ counter, status }: BalanceCardProps) {
  const { tone, hint } = status;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Solde du compteur</Text>
      <Text
        style={[
          styles.balance,
          tone === 'even' ? styles.even : tone === 'ahead' ? styles.positive : styles.negative,
        ]}
        accessibilityRole="header"
      >
        {counter.format()}
      </Text>
      <Text style={[styles.hint, tone === 'beyond-deficit' && styles.alert]}>{hint}</Text>
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
  alert: {
    fontFamily: FONTS.semiBold,
    color: COLORS.warningText,
    backgroundColor: COLORS.warningBackground,
    borderRadius: RADIUS.input,
    padding: SPACING.sm,
  },
});
