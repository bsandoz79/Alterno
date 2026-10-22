import type { MonthSummary } from '@alterno/engine';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMonth, formatShortDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { dayLine, recoveryLabel } from '../history-view';

/**
 * Carte d'un mois : heures faites sur attendues, écart, jours travaillés, récups et école.
 * Un appui déplie le détail jour par jour.
 *
 * @param props - Résumé du mois
 * @returns La carte
 */
export function MonthCard({ month }: { readonly month: MonthSummary }) {
  const [open, setOpen] = useState(false);
  const title = formatMonth(month.month);
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title} : ${open ? 'masquer' : 'voir'} le détail`}
        onPress={() => {
          setOpen(!open);
        }}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <Text style={styles.month}>{title}</Text>
          <Text style={styles.hours}>
            {`${month.worked.format()} faites / ${month.expected.format()} attendues`}
          </Text>
        </View>
        <Text
          style={[styles.balance, month.balance.isNegative() ? styles.negative : styles.positive]}
        >
          {month.balance.format({ signed: true })}
        </Text>
      </Pressable>
      <View style={styles.stats}>
        <Stat label="Jours travaillés" value={String(month.workedDays)} />
        <Stat label="Récups" value={recoveryLabel(month.recoveryDays)} />
        <Stat
          label="École"
          value={month.schoolDays === 0 ? '—' : `${String(month.schoolDays)} j`}
        />
      </View>
      {open
        ? month.days.map((day) => (
            <View key={day.date.toIsoString()} style={styles.dayRow}>
              <Text style={styles.dayDate}>{formatShortDate(day.date)}</Text>
              <Text style={styles.dayValue}>{dayLine(day)}</Text>
            </View>
          ))
        : null}
    </View>
  );
}

/** Petit chiffre avec son libellé. */
function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  month: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.text,
  },
  hours: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  balance: {
    fontFamily: FONTS.extraBold,
    fontSize: 20,
  },
  positive: {
    color: COLORS.positive,
  },
  negative: {
    color: COLORS.primary,
  },
  stats: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.background,
  },
  statValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.text,
  },
  statLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayDate: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.text,
  },
  dayValue: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text,
  },
});
