import type { MonthSummary } from '@alterno/engine';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { balanceBars } from '../history-view';

/** Hauteur de chaque moitié du graphique (au-dessus et au-dessous de zéro). */
const HALF_HEIGHT = 56;
const MONTH_NAMES = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/**
 * Évolution du solde : une barre par mois, vers le haut en vert si le solde cumulé est positif,
 * vers le bas en rouge s'il est négatif. Dessinée avec de simples vues : pas de bibliothèque de graphiques.
 *
 * @param props - Mois de l'historique
 * @returns Le graphique
 */
export function BalanceChart({ months }: { readonly months: readonly MonthSummary[] }) {
  const bars = balanceBars(months);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Solde à la fin de chaque mois</Text>
      <View style={styles.chart}>
        {bars.map((bar) => (
          <View
            key={`${String(bar.month.year)}-${String(bar.month.month)}`}
            style={styles.column}
            accessibilityLabel={`${MONTH_NAMES[bar.month.month - 1] ?? ''} ${String(bar.month.year)} : ${bar.label}`}
          >
            <Text style={styles.value}>{bar.label}</Text>
            <View style={styles.half}>
              {bar.positive ? (
                <View style={[styles.bar, styles.positive, { height: bar.ratio * HALF_HEIGHT }]} />
              ) : null}
            </View>
            <View style={styles.axis} />
            <View style={[styles.half, styles.below]}>
              {bar.positive ? null : (
                <View style={[styles.bar, styles.negative, { height: bar.ratio * HALF_HEIGHT }]} />
              )}
            </View>
            <Text style={styles.month}>{MONTH_NAMES[bar.month.month - 1]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  chart: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 64,
  },
  value: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.text,
  },
  half: {
    height: HALF_HEIGHT,
    width: '70%',
    justifyContent: 'flex-end',
  },
  below: {
    justifyContent: 'flex-start',
  },
  axis: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.border,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  positive: {
    backgroundColor: COLORS.positive,
  },
  negative: {
    backgroundColor: COLORS.primary,
  },
  month: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
