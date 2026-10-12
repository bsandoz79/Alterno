import type { DatedDay } from '@alterno/engine';
import { StyleSheet, Text, View } from 'react-native';

import { formatShortDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/**
 * Liste « Le reste de la semaine » : pour chaque jour planifié, ses horaires et le temps prévu.
 *
 * @param props - Jours planifiés restants
 * @returns La liste
 */
export function RestOfWeek({ days }: { readonly days: readonly DatedDay[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Le reste de la semaine</Text>
      {days.map(({ date, plan }) => (
        <View key={date.toIsoString()} style={styles.row}>
          <View style={styles.dayInfo}>
            <Text style={styles.day}>{formatShortDate(date)}</Text>
            <Text style={styles.hours}>
              {`${plan.arrival.format()} → ${plan.departure.format()}`}
            </Text>
          </View>
          <Text style={styles.worked}>{plan.worked.format()}</Text>
        </View>
      ))}
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
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayInfo: {
    gap: 2,
  },
  day: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  hours: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  worked: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.primary,
  },
});
