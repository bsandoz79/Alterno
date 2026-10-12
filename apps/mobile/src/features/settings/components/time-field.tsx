import { StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/** Propriétés d'un champ de saisie d'heure ou de durée. */
interface TimeFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

/**
 * Ligne « libellé — champ » pour saisir une heure (7h30) ou une durée (0h45).
 * Saisie libre : la validation se fait à l'enregistrement, avec un message qui nomme le champ.
 *
 * @param props - Libellé, valeur et action de modification
 * @returns Le champ
 */
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        inputMode="text"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  label: {
    flex: 1,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.text,
  },
  input: {
    width: 92,
    height: 44,
    borderRadius: RADIUS.input,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    textAlign: 'center',
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.text,
  },
});
