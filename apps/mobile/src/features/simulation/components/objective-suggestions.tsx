import type { ObjectiveSuggestion } from '@alterno/engine';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/** Propriétés des objectifs proposés. */
interface ObjectiveSuggestionsProps {
  readonly suggestion: ObjectiveSuggestion;
  /** Objectif affiché dans le champ (texte), pour mettre en avant la proposition choisie. */
  readonly target: string;
  /** Remplace l'objectif par la proposition touchée. */
  readonly onPick: (target: string) => void;
}

/**
 * Objectifs proposés sous le champ « Objectif d'heures » : le reste à faire de la semaine
 * (temps attendu moins ce qui est déjà fait) et le maximum (horaires et plafond du compteur).
 *
 * @param props - Proposition, objectif affiché et action de choix
 * @returns Les deux propositions, précédées de ce qui est déjà fait
 */
export function ObjectiveSuggestions({ suggestion, target, onPick }: ObjectiveSuggestionsProps) {
  const choices = [
    { label: 'Reste à faire', value: suggestion.remaining.format() },
    { label: 'Maximum', value: suggestion.maximum.format() },
  ];
  return (
    <View style={styles.container}>
      {suggestion.done.isZero() ? null : (
        <Text style={styles.done}>{`Déjà fait cette semaine : ${suggestion.done.format()}`}</Text>
      )}
      <View style={styles.row}>
        {choices.map(({ label, value }) => {
          const selected = target === value;
          return (
            <Pressable
              key={label}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                onPick(value);
              }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {`${label} · ${value}`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  done: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.primary,
  },
  chipTextSelected: {
    color: COLORS.surface,
  },
});
