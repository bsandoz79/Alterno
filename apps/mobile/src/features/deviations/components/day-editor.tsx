import type { PaceName } from '@alterno/engine';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MessageBox } from '@/shared/components/message-box';
import { SegmentedControl } from '@/shared/components/segmented-control';
import { TimeField } from '@/shared/components/time-field';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { useDayEdit, type DayEditParams } from '../hooks/use-day-edit';
import { RecalculationPreview } from './recalculation-preview';

const PACE_OPTIONS: readonly { readonly value: PaceName; readonly label: string }[] = [
  { value: 'fast', label: 'Rapide' },
  { value: 'steady', label: 'Régulier' },
  { value: 'late', label: 'Au plus juste' },
];

/**
 * Formulaire « Modifier ce jour » : horaires réels pré-remplis avec le plan, rythme du rattrapage,
 * aperçu du recalcul à chaque saisie, puis enregistrement.
 *
 * @param props - Données chargées, jour modifié et action après enregistrement
 * @returns L'éditeur
 */
export function DayEditor(props: DayEditParams) {
  const { form, update, preview, save, message } = useDayEdit(props);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Ce qui a changé (ou va changer)</Text>
        <TimeField
          label="Arrivée"
          value={form.arrival}
          onChange={(arrival) => {
            update({ arrival });
          }}
        />
        <TimeField
          label="Début de pause"
          value={form.lunchStart}
          onChange={(lunchStart) => {
            update({ lunchStart });
          }}
        />
        <TimeField
          label="Fin de pause"
          value={form.lunchEnd}
          onChange={(lunchEnd) => {
            update({ lunchEnd });
          }}
        />
        <TimeField
          label="Départ"
          value={form.departure}
          onChange={(departure) => {
            update({ departure });
          }}
        />
        <Text style={styles.cardLabel}>Rattrapage sur les jours suivants</Text>
        <SegmentedControl
          accessibilityLabel="Rythme du rattrapage"
          onSurface
          options={PACE_OPTIONS}
          selected={form.pace}
          onChange={(pace) => {
            update({ pace });
          }}
        />
      </View>

      <RecalculationPreview preview={preview} />
      {message === null ? null : <MessageBox message={message} />}

      <Pressable
        style={[styles.saveButton, !preview.ok && styles.saveButtonDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !preview.ok }}
        disabled={!preview.ok}
        onPress={() => void save()}
      >
        <Text style={styles.saveLabel}>Enregistrer et recalculer</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  cardLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  saveButton: {
    height: 58,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.surface,
  },
});
