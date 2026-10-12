import type { CalendarDate } from '@alterno/engine';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatShortDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/** Propriétés du choix du jour de récup. */
interface RecoveryDayPickerProps {
  readonly choices: readonly CalendarDate[];
  /** Date choisie (« AAAA-MM-JJ ») ou `null`. */
  readonly selected: string | null;
  readonly onSelect: (isoDate: string) => void;
}

/**
 * Pastilles des jours où poser la récup (jours de la période, sauf le premier).
 *
 * @param props - Jours possibles, jour choisi et action de choix
 * @returns Les pastilles
 */
export function RecoveryDayPicker({ choices, selected, onSelect }: RecoveryDayPickerProps) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Jour de récup">
      {choices.map((date) => {
        const iso = date.toIsoString();
        const isSelected = iso === selected;
        return (
          <Pressable
            key={iso}
            style={[styles.chip, isSelected && styles.chipSelected]}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              onSelect(iso);
            }}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {formatShortDate(date)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    borderRadius: RADIUS.input,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  labelSelected: {
    fontFamily: FONTS.extraBold,
    color: COLORS.primary,
  },
});
