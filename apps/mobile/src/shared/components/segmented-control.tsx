import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/** Option d'un sélecteur segmenté. */
export interface SegmentOption<T extends string | number> {
  readonly value: T;
  readonly label: string;
}

/** Propriétés du sélecteur segmenté. */
interface SegmentedControlProps<T extends string | number> {
  readonly options: readonly SegmentOption<T>[];
  readonly selected: T;
  readonly onChange: (value: T) => void;
  /** Libellé lu par les lecteurs d'écran. */
  readonly accessibilityLabel: string;
  /** Fond sur lequel il est posé : crème (écran, par défaut) ou blanc (carte), pour garder le contraste. */
  readonly onSurface?: boolean;
}

/**
 * Choix exclusif entre quelques options, en pilule (charte L4) : l'option choisie est en rouge.
 *
 * @param props - Options, valeur choisie et action de changement
 * @returns Le sélecteur
 */
export function SegmentedControl<T extends string | number>({
  options,
  selected,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View
      style={styles.track}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={String(option.value)}
            style={[styles.segment, isSelected && styles.segmentSelected]}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              onChange(option.value);
            }}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  trackOnSurface: {
    backgroundColor: COLORS.background,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  segmentSelected: {
    backgroundColor: COLORS.primary,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  labelSelected: {
    fontFamily: FONTS.extraBold,
    color: COLORS.surface,
  },
});
