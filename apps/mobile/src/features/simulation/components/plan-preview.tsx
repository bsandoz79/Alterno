import type { Simulation } from '@alterno/engine';
import { StyleSheet, Text, View } from 'react-native';

import { formatShortDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/**
 * Aperçu du plan simulé : une ligne par jour (arrivée, départ, pause, temps travaillé) et le total.
 *
 * @param props - Simulation à afficher
 * @returns L'aperçu
 */
export function PlanPreview({ simulation }: { readonly simulation: Simulation }) {
  return (
    <View style={styles.card}>
      {simulation.days.map(({ date, plan }) => (
        <View key={date.toIsoString()} style={styles.row}>
          <View style={styles.dayColumn}>
            <Text style={styles.day}>{formatShortDate(date)}</Text>
            <Text style={styles.detail}>
              {plan.arrival.format()} → {plan.departure.format()} · pause {plan.lunchBreak.format()}
            </Text>
          </View>
          <Text style={styles.worked}>{plan.worked.format()}</Text>
        </View>
      ))}
      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.worked}>{simulation.totalWorked.format()}</Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  dayColumn: {
    flex: 1,
    gap: 2,
  },
  day: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.text,
  },
  detail: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  worked: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.primarySoft,
    paddingTop: SPACING.md,
  },
  totalLabel: {
    flex: 1,
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.textMuted,
  },
});
