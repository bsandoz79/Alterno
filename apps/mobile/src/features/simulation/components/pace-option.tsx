import { Pressable, StyleSheet, View } from 'react-native';

import { InfoTip } from '@/shared/components/info-tip';
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
const CHART_WIDTH = 64;
const BAR_GAP = 3;

/**
 * Carte de choix d'un rythme, avec un mini-graphique de l'effort jour après jour (maquette Simulation).
 * Sa description s'affiche à la demande (icône « i »), le graphique suffisant à la reconnaître.
 * La largeur des barres s'adapte au nombre de jours : le graphique garde la même taille sur 1 semaine ou 1 mois.
 *
 * @param props - Titre, description, forme du graphique et sélection
 * @returns La carte
 */
export function PaceOption({ title, description, shape, selected, onSelect }: PaceOptionProps) {
  const barWidth = Math.max(
    2,
    Math.floor((CHART_WIDTH - BAR_GAP * (shape.length - 1)) / shape.length),
  );
  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onSelect}
    >
      <View style={styles.texts}>
        <InfoTip title={title} info={description} titleStyle={styles.title} />
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
              { width: barWidth, height: Math.max(4, height * BAR_MAX_HEIGHT) },
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
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: BAR_GAP,
    width: CHART_WIDTH,
    height: BAR_MAX_HEIGHT,
  },
  bar: {
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  barSelected: {
    backgroundColor: COLORS.primary,
  },
});
