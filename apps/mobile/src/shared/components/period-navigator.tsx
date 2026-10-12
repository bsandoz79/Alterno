import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/** Propriétés du navigateur de période. */
interface PeriodNavigatorProps {
  /** Période affichée, ex. « Semaine du lundi 19 octobre ». */
  readonly label: string;
  /** Action vers la période précédente ; `null` quand le plan ne remonte pas plus loin. */
  readonly onPrevious: (() => void) | null;
  /** Action vers la période suivante ; `null` quand le plan s'arrête là. */
  readonly onNext: (() => void) | null;
  /** Nom de la période pour les lecteurs d'écran (« semaine », « mois »). */
  readonly unit: string;
}

/**
 * Barre « ‹ période › » au-dessus de la grille. Une flèche sans destination reste visible
 * mais grisée, pour que la barre ne change pas de forme d'une période à l'autre.
 *
 * @param props - Libellé et actions précédente / suivante
 * @returns La barre de navigation
 */
export function PeriodNavigator({ label, onPrevious, onNext, unit }: PeriodNavigatorProps) {
  return (
    <View style={styles.row}>
      <Arrow symbol="‹" action={onPrevious} accessibilityLabel={`${unit} précédente`} />
      <Text style={styles.label} accessibilityRole="header">
        {label}
      </Text>
      <Arrow symbol="›" action={onNext} accessibilityLabel={`${unit} suivante`} />
    </View>
  );
}

/** Propriétés d'une flèche. */
interface ArrowProps {
  readonly symbol: string;
  readonly action: (() => void) | null;
  readonly accessibilityLabel: string;
}

/**
 * Bouton flèche, désactivé quand il n'a pas d'action.
 *
 * @param props - Symbole, action et libellé accessible
 * @returns Le bouton
 */
function Arrow({ symbol, action, accessibilityLabel }: ArrowProps) {
  const disabled = action === null;
  return (
    <Pressable
      onPress={action ?? undefined}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
    >
      <Text style={[styles.arrowText, disabled && styles.arrowDisabled]}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.text,
  },
  arrow: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
  },
  arrowPressed: {
    backgroundColor: COLORS.primarySoft,
  },
  arrowText: {
    fontFamily: FONTS.extraBold,
    fontSize: 22,
    lineHeight: 24,
    color: COLORS.primary,
  },
  arrowDisabled: {
    color: COLORS.border,
  },
});
