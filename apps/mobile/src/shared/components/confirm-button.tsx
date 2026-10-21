import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/** Propriétés du bouton à confirmation. */
interface ConfirmButtonProps {
  /** Texte du bouton. */
  readonly label: string;
  /** Ce qui va se passer, affiché avant de confirmer. */
  readonly warning: string;
  /** Texte du bouton de confirmation. */
  readonly confirmLabel: string;
  /** Action, lancée seulement après confirmation. */
  readonly onConfirm: () => Promise<void>;
}

/**
 * Bouton d'une action difficile à défaire (annuler un plan, une récup) : un premier appui
 * explique ce qui va se passer, un second confirme. La confirmation est dans l'écran plutôt
 * que dans une boîte de dialogue, qui ne s'affiche pas de la même façon sur le web.
 *
 * @param props - Libellés, avertissement et action
 * @returns Le bouton, ou l'avertissement avec « Confirmer » et « Garder »
 */
export function ConfirmButton({ label, warning, confirmLabel, onConfirm }: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <Pressable
        style={styles.outline}
        accessibilityRole="button"
        onPress={() => {
          setAsking(true);
        }}
      >
        <Text style={styles.outlineLabel}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.box} accessibilityLiveRegion="polite">
      <Text style={styles.warning}>{warning}</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.button, styles.confirm]}
          accessibilityRole="button"
          onPress={() => {
            setAsking(false);
            void onConfirm();
          }}
        >
          <Text style={styles.confirmLabel}>{confirmLabel}</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.keep]}
          accessibilityRole="button"
          onPress={() => {
            setAsking(false);
          }}
        >
          <Text style={styles.keepLabel}>Garder</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outline: {
    height: 48,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.primary,
  },
  box: {
    backgroundColor: COLORS.warningBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  warning: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.warningText,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirm: {
    backgroundColor: COLORS.primary,
  },
  confirmLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 14,
    color: COLORS.surface,
  },
  keep: {
    backgroundColor: COLORS.surface,
  },
  keepLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 14,
    color: COLORS.text,
  },
});
