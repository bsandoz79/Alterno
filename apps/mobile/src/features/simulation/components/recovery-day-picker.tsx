import type { RecoveryChoice } from '@alterno/engine';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatShortDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { unavailableReason } from '../recovery-choices';

/** Propriétés du choix du jour de récup. */
interface RecoveryDayPickerProps {
  readonly choices: readonly RecoveryChoice[];
  /** Date choisie (« AAAA-MM-JJ ») ou `null`. */
  readonly selected: string | null;
  readonly onSelect: (isoDate: string) => void;
}

/**
 * Pastilles des jours où poser la récup (jours de la période, sauf le premier).
 * Les jours impossibles restent affichés, barrés : les survoler (web) ou appuyer dessus (Android)
 * explique combien d'heures manquent, au lieu de les faire disparaître sans raison.
 *
 * @param props - Jours proposés, jour choisi et action de choix
 * @returns Les pastilles et, si besoin, l'explication du jour barré
 */
export function RecoveryDayPicker({ choices, selected, onSelect }: RecoveryDayPickerProps) {
  // Jour barré dont l'explication est affichée (survolé ou touché).
  const [explained, setExplained] = useState<string | null>(null);
  const explainedChoice = choices.find((choice) => choice.date.toIsoString() === explained);
  const reason = explainedChoice === undefined ? null : unavailableReason(explainedChoice);

  return (
    <View style={styles.container}>
      <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Jour de récup">
        {choices.map((choice) => {
          const iso = choice.date.toIsoString();
          const label = formatShortDate(choice.date);
          const unavailable = unavailableReason(choice);
          const isSelected = unavailable === null && iso === selected;
          return (
            <Pressable
              key={iso}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                unavailable !== null && styles.chipUnavailable,
              ]}
              accessibilityRole="radio"
              accessibilityLabel={unavailable === null ? label : `${label}. ${unavailable}`}
              accessibilityState={{ selected: isSelected, disabled: unavailable !== null }}
              onPress={() => {
                if (unavailable === null) {
                  setExplained(null);
                  onSelect(iso);
                } else {
                  setExplained(iso);
                }
              }}
              onHoverIn={() => {
                if (unavailable !== null) {
                  setExplained(iso);
                }
              }}
              onHoverOut={() => {
                setExplained((current) => (current === iso ? null : current));
              }}
            >
              <Text
                style={[
                  styles.label,
                  isSelected && styles.labelSelected,
                  unavailable !== null && styles.labelUnavailable,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {explainedChoice === undefined || reason === null ? null : (
        <Text style={styles.reason} accessibilityLiveRegion="polite">
          {formatShortDate(explainedChoice.date)} · {reason}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
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
  chipUnavailable: {
    borderStyle: 'dashed',
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
  labelUnavailable: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  reason: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.warningText,
    backgroundColor: COLORS.warningBackground,
    borderRadius: RADIUS.input,
    padding: SPACING.sm,
  },
});
