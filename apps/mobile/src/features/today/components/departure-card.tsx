import type { DayPlan } from '@alterno/engine';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/**
 * Carte principale de l'accueil : l'heure de départ prévue en grand (l'information qu'on vient
 * chercher), puis l'arrivée, la pause et le temps travaillé.
 *
 * @param props - Journée prévue aujourd'hui
 * @returns La carte
 */
export function DepartureCard({ day }: { readonly day: DayPlan }) {
  const details: readonly (readonly [string, string])[] = [
    ['Arrivée', day.arrival.format()],
    ['Pause', `${day.lunchBreak.start.format()} – ${day.lunchBreak.end.format()}`],
    ['Travaillé', day.worked.format()],
  ];
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Départ prévu</Text>
      <Text style={styles.departure} accessibilityRole="header">
        {day.departure.format()}
      </Text>
      <View style={styles.details}>
        {details.map(([label, value]) => (
          <View key={label} style={styles.detail}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.primarySoft,
  },
  departure: {
    fontFamily: FONTS.extraBold,
    fontSize: 56,
    lineHeight: 64,
    color: COLORS.surface,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  detail: {
    gap: 2,
  },
  detailLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.primarySoft,
  },
  detailValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.surface,
  },
});
