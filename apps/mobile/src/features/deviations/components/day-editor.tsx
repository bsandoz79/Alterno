import type { PaceName } from '@alterno/engine';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmButton } from '@/shared/components/confirm-button';
import { MessageBox } from '@/shared/components/message-box';
import { SegmentedControl } from '@/shared/components/segmented-control';
import { TimeField } from '@/shared/components/time-field';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { FIELD_LABELS, isOutOfReach } from '../day-edit-form';
import { useDayEdit, type DayEditParams } from '../hooks/use-day-edit';
import { CHANGE_KINDS, changeFields, type ChangeKind } from '../report-change';
import { RecalculationPreview } from './recalculation-preview';

const PACE_OPTIONS: readonly { readonly value: PaceName; readonly label: string }[] = [
  { value: 'fast', label: 'Rapide' },
  { value: 'steady', label: 'Régulier' },
  { value: 'late', label: 'Au plus juste' },
];

/** Propriétés de l'éditeur : celles du hook, plus le changement signalé depuis l'accueil. */
interface DayEditorProps extends DayEditParams {
  /** Changement signalé (une seule heure à saisir), ou `null` pour modifier toute la journée. */
  readonly change: ChangeKind | null;
}

/**
 * Formulaire « Modifier ce jour » : horaires réels pré-remplis avec le plan, rythme du rattrapage,
 * aperçu du recalcul à chaque saisie, puis enregistrement.
 * Ouvert depuis « Signaler un changement », il n'affiche que l'heure concernée (saisie rapide),
 * avec un lien pour corriger les autres heures si besoin.
 *
 * @param props - Données chargées, jour modifié, changement signalé et action après enregistrement
 * @returns L'éditeur
 */
export function DayEditor({ change, ...params }: DayEditorProps) {
  const { form, update, preview, save, saveAndCancel, message } = useDayEdit(params);
  // Plan devenu irréalisable : deux choix, garder (le manque va au compteur) ou annuler la suite.
  const outOfReach = isOutOfReach(preview);
  const [showAll, setShowAll] = useState(false);
  const fields = changeFields(showAll ? null : change);
  const question = CHANGE_KINDS.find((choice) => choice.kind === change)?.question;

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{question ?? 'Ce qui a changé (ou va changer)'}</Text>
        {fields.map((field) => (
          <TimeField
            key={field}
            label={FIELD_LABELS[field]}
            value={form[field]}
            onChange={(value) => {
              update({ [field]: value });
            }}
          />
        ))}
        {fields.length < 4 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setShowAll(true);
            }}
          >
            <Text style={styles.moreLink}>Modifier les autres horaires</Text>
          </Pressable>
        ) : null}
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
        <Text style={styles.saveLabel}>
          {outOfReach ? 'Garder et prendre sur le compteur' : 'Enregistrer et recalculer'}
        </Text>
      </Pressable>
      {outOfReach ? (
        <ConfirmButton
          label="Annuler le plan"
          warning="La journée est enregistrée telle que saisie, puis les jours suivants repassent à 7h et la récup prévue est annulée."
          confirmLabel="Enregistrer et annuler"
          onConfirm={saveAndCancel}
        />
      ) : null}
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
  moreLink: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
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
