import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatShortDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import type { SchoolMonthRow } from '../school-month';

/** Propriétés d'une ligne semaine. */
interface SchoolWeekRowProps {
  readonly row: SchoolMonthRow;
  readonly onToggle: () => void;
}

/**
 * Ligne d'une semaine : les numéros du lundi au vendredi et l'étiquette « École » si elle est marquée.
 * Toute la ligne est un seul bouton : on marque une semaine entière d'un appui.
 *
 * @param props - Semaine et action de marquage
 * @returns La ligne
 */
export function SchoolWeekRow({ row, onToggle }: SchoolWeekRowProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: row.school }}
      accessibilityLabel={`Semaine du ${formatShortDate(row.monday)} : école`}
      style={({ pressed }) => [
        styles.row,
        row.school && styles.rowSchool,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.days}>
        {row.days.map(({ date, inMonth }) => (
          <Text
            key={date.toIsoString()}
            style={[styles.day, row.school && styles.daySchool, !inMonth && styles.dayOutside]}
          >
            {String(date.day)}
          </Text>
        ))}
      </View>
      <Text style={[styles.badge, row.school ? styles.badgeSchool : styles.badgeWork]}>
        {row.school ? 'École' : 'Entreprise'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.input,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  rowSchool: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  rowPressed: {
    opacity: 0.7,
  },
  days: {
    flex: 1,
    flexDirection: 'row',
  },
  day: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  daySchool: {
    color: COLORS.surface,
  },
  dayOutside: {
    opacity: 0.4,
  },
  badge: {
    width: 84,
    textAlign: 'center',
    fontFamily: FONTS.extraBold,
    fontSize: 12,
  },
  badgeSchool: {
    color: COLORS.surface,
  },
  badgeWork: {
    color: COLORS.textMuted,
  },
});
