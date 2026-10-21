import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InfoTip } from '@/shared/components/info-tip';
import { MessageBox } from '@/shared/components/message-box';
import { TimeField } from '@/shared/components/time-field';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import type { RecalibrationPreview } from '../recalibration-form';

/** Propriétés de la carte de recalage. */
interface RecalibrateCardProps {
  readonly input: string;
  readonly onChange: (value: string) => void;
  readonly preview: RecalibrationPreview | null;
  readonly onRecalibrate: () => void;
}

/**
 * Carte « Recaler sur Smart RH » : saisie du solde officiel, correction calculée en direct,
 * avertissement si l'écart dépasse 30 min, puis enregistrement.
 *
 * @param props - Saisie, aperçu et action
 * @returns La carte
 */
export function RecalibrateCard({ input, onChange, preview, onRecalibrate }: RecalibrateCardProps) {
  const ready = preview?.ok === true;
  return (
    <View style={styles.card}>
      <InfoTip
        title="Recaler sur Smart RH"
        info="Saisis le solde affiché dans Smart RH : il fait foi, le compteur d’Alterno prend sa valeur."
        titleStyle={styles.title}
      />
      <TimeField label="Solde Smart RH" value={input} onChange={onChange} placeholder="+2h15" />
      {preview === null ? null : preview.ok ? (
        <>
          <Text style={styles.correction}>
            {`Correction : ${preview.recalibration.adjustment.format({ signed: true })} → nouveau solde ${preview.recalibration.counter.format()}`}
          </Text>
          {preview.recalibration.warning === null ? null : (
            <MessageBox message={{ kind: 'info', text: preview.recalibration.warning }} />
          )}
        </>
      ) : (
        <MessageBox message={{ kind: 'error', text: preview.error }} />
      )}
      <Pressable
        style={[styles.button, !ready && styles.buttonDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !ready }}
        disabled={!ready}
        onPress={onRecalibrate}
      >
        <Text style={styles.buttonLabel}>Recaler le compteur</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.text,
  },
  correction: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  button: {
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.surface,
  },
});
