import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/** Message de résultat d'une action (enregistrement, erreur de saisie, information). */
export interface FormMessage {
  readonly kind: 'success' | 'error' | 'info';
  readonly text: string;
}

/**
 * Encadré de message : vert si l'action a réussi, ambre pour une erreur ou une information.
 *
 * @param props - Message à afficher
 * @returns L'encadré
 */
export function MessageBox({ message }: { readonly message: FormMessage }) {
  const isSuccess = message.kind === 'success';
  return (
    <View
      style={[styles.box, isSuccess ? styles.success : styles.warning]}
      accessibilityLiveRegion="polite"
    >
      <Text style={isSuccess ? styles.successText : styles.warningText}>{message.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: RADIUS.card,
    padding: SPACING.md,
  },
  success: {
    backgroundColor: COLORS.surface,
  },
  warning: {
    backgroundColor: COLORS.warningBackground,
  },
  successText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.positive,
  },
  warningText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.warningText,
  },
});
