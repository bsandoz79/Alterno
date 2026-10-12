import { StyleSheet, Text, View } from 'react-native';

import { MessageBox } from '@/shared/components/message-box';
import { formatShortDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import type { DayEditPreview } from '../day-edit-form';

/**
 * Aperçu du recalcul, avant enregistrement : alertes (écart du jour, règle non respectée,
 * objectif hors d'atteinte…) puis les jours suivants dont l'horaire change.
 *
 * @param props - Aperçu calculé, ou erreur de saisie
 * @returns L'aperçu
 */
export function RecalculationPreview({ preview }: { readonly preview: DayEditPreview }) {
  if (!preview.ok) {
    return <MessageBox message={{ kind: 'error', text: preview.error }} />;
  }
  const { outcome, recalculated } = preview;
  return (
    <>
      {outcome.alerts.map((alert) => (
        <MessageBox key={alert.message} message={{ kind: 'info', text: alert.message }} />
      ))}
      <View style={styles.card}>
        <Text style={styles.title}>Jours suivants recalculés</Text>
        {recalculated.length === 0 ? (
          <Text style={styles.empty}>Aucun changement sur les jours suivants.</Text>
        ) : (
          recalculated.map(({ date, before, after }) => (
            <View key={date.toIsoString()} style={styles.row}>
              <View style={styles.dayInfo}>
                <Text style={styles.day}>{formatShortDate(date)}</Text>
                <Text style={styles.hours}>
                  {`${after.arrival.format()} → ${after.departure.format()}`}
                </Text>
              </View>
              <Text style={styles.change}>{`${before.format()} → ${after.worked.format()}`}</Text>
            </View>
          ))
        )}
      </View>
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
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  empty: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayInfo: {
    gap: 2,
  },
  day: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  hours: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  change: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.primary,
  },
});
