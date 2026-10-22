import { StyleSheet, Text, View } from 'react-native';

import { MessageBox } from '@/shared/components/message-box';
import { SegmentedControl } from '@/shared/components/segmented-control';
import { TimeField } from '@/shared/components/time-field';
import { formatShortDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import type { ArrivalChoiceName, DayEditForm, DayEditPreview } from '../day-edit-form';

/** Propriétés de la carte : l'aperçu réussi, la saisie et l'action de mise à jour. */
interface ArrivalChoiceCardProps {
  readonly preview: Extract<DayEditPreview, { ok: true }>;
  readonly form: DayEditForm;
  readonly update: (changes: Partial<DayEditForm>) => void;
}

/**
 * Carte « Arrivée repoussée » : affichée quand le recalcul fait arriver plus tard que d'habitude.
 * Trois choix : garder son heure habituelle (la journée s'allonge, le surplus va au compteur),
 * garder le recalcul, ou taper une autre heure. L'effet sur le plan s'affiche avant d'enregistrer.
 *
 * @param props - Aperçu, saisie et mise à jour
 * @returns La carte, ou rien si aucune arrivée n'est repoussée
 */
export function ArrivalChoiceCard({ preview, form, update }: ArrivalChoiceCardProps) {
  const { lateArrivals } = preview.outcome;
  const [first] = lateArrivals;
  if (first === undefined) {
    return null;
  }
  // Une seule heure habituelle sur les jours concernés : on la nomme dans le bouton.
  const samePreferred = lateArrivals.every((late) => late.preferred.equals(first.preferred));
  const options: readonly { readonly value: ArrivalChoiceName; readonly label: string }[] = [
    {
      value: 'preferred',
      label: samePreferred ? `Garder ${first.preferred.format()}` : 'Mes heures',
    },
    { value: 'recalculated', label: 'Recalcul' },
    { value: 'chosen', label: 'Autre heure' },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Arrivée repoussée</Text>
      {lateArrivals.map((late) => (
        <Text key={late.date.toIsoString()} style={styles.line}>
          {`${formatShortDate(late.date)} : ${late.planned.format()} au lieu de ${late.preferred.format()}`}
        </Text>
      ))}
      <SegmentedControl
        accessibilityLabel="Heure d’arrivée à garder"
        onSurface
        options={options}
        selected={form.arrivalChoice}
        onChange={(arrivalChoice) => {
          update({ arrivalChoice });
        }}
      />
      {form.arrivalChoice === 'chosen' ? (
        <TimeField
          label="Arrivée"
          value={form.chosenArrival}
          placeholder={first.preferred.format()}
          onChange={(chosenArrival) => {
            update({ chosenArrival });
          }}
        />
      ) : null}
      {preview.extra.isZero() ? null : (
        <Text style={styles.effect}>
          {`${preview.extra.format({ signed: true })} sur le plan, pour ton compteur.`}
        </Text>
      )}
      {preview.arrivalError === null ? null : (
        <MessageBox message={{ kind: 'error', text: preview.arrivalError }} />
      )}
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
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  line: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  effect: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.primary,
  },
});
