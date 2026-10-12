import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/** Propriétés d'une carte de rythme. */
interface PaceOptionProps {
  readonly title: string;
  readonly description: string;
  /** Hauteurs relatives (0 à 1) des barres illustrant l'effort jour après jour. */
  readonly shape: readonly number[];
  readonly selected: boolean;
  readonly onSelect: () => void;
}

const BAR_MAX_HEIGHT = 34;

/**
 * Carte de choix d'un rythme, avec un mini-graphique de l'effort de la semaine (maquette Simulation).
 *
 * @param props - Titre, description, forme du graphique et sélection
 * @returns La carte
 */
export function PaceOption({ title, description, shape, selected, onSelect }: PaceOptionProps) {
  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onSelect}
    >
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View
        style={styles.bars}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {shape.map((height, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              { height: Math.max(6, height * BAR_MAX_HEIGHT) },
              selected && styles.barSelected,
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cardSelected: {
    borderColor: COLORS.primary,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.text,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: BAR_MAX_HEIGHT,
  },
  bar: {
    width: 8,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  barSelected: {
    backgroundColor: COLORS.primary,
  },
});
