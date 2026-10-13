import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import type { UpcomingBalanceView } from '../upcoming-balance';

/**
 * Carte « Solde à venir » : ce qu'il restera au compteur une fois le plan en cours suivi
 * et la récup posée, pour ne pas compter sur des heures déjà réservées.
 *
 * @param props - Solde à venir préparé pour l'affichage
 * @returns La carte
 */
export function UpcomingBalanceCard({ upcoming }: { readonly upcoming: UpcomingBalanceView }) {
  const { value, tone, detail, alert } = upcoming;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>Solde à venir</Text>
        <Text
          style={[
            styles.value,
            tone === 'even' ? styles.even : tone === 'ahead' ? styles.positive : styles.negative,
          ]}
        >
          {value}
        </Text>
      </View>
      <Text style={styles.detail}>{detail}</Text>
      {alert === null ? null : <Text style={styles.alert}>{alert}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: SPACING.md,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  value: {
    fontFamily: FONTS.extraBold,
    fontSize: 28,
  },
  even: {
    color: COLORS.text,
  },
  positive: {
    color: COLORS.positive,
  },
  negative: {
    color: COLORS.primary,
  },
  detail: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  alert: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.warningText,
    backgroundColor: COLORS.warningBackground,
    borderRadius: RADIUS.input,
    padding: SPACING.sm,
  },
});
