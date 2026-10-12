import type { DayPlan } from '@alterno/engine';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/**
 * Carte « Prévu » : les horaires du jour dans le plan en cours.
 *
 * @param props - Journée prévue
 * @returns La carte
 */
export function PlannedDayCard({ day }: { readonly day: DayPlan }) {
  const rows: readonly (readonly [string, string])[] = [
    ['Arrivée', day.arrival.format()],
    ['Pause', `${day.lunchBreak.start.format()} – ${day.lunchBreak.end.format()}`],
    ['Départ', day.departure.format()],
  ];
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Prévu</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.label}>Temps travaillé</Text>
        <Text style={styles.total}>{day.worked.format()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.primarySoft,
    paddingTop: SPACING.sm,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.text,
  },
  value: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  total: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.primary,
  },
});
