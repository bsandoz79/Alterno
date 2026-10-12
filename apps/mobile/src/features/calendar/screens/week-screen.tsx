import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { systemClock } from '@/shared/clock/system-clock';
import { ScreenContainer } from '@/shared/components/screen-container';
import { formatLongDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { WeekGrid } from '../components/week-grid';
import { useCurrentPlan } from '../hooks/use-current-plan';
import { selectWeek } from '../week-view';

/**
 * Écran « Semaine » : le plan validé, en grille façon emploi du temps EPSI, avec le total de la semaine.
 *
 * @returns L'écran
 */
export function WeekScreen() {
  const plan = useCurrentPlan();
  const today = systemClock.today();

  if (plan === undefined) {
    return <ScreenContainer title="Ma semaine" />;
  }
  if (plan === null) {
    return (
      <ScreenContainer title="Ma semaine">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aucun plan validé</Text>
          <Text style={styles.cardText}>
            Fais une simulation puis « Valider ce plan » : ta semaine s’affichera ici.
          </Text>
          <Link href="/simulation" style={styles.link}>
            Aller à la simulation
          </Link>
        </View>
      </ScreenContainer>
    );
  }

  const week = selectWeek(plan, today);
  return (
    <ScreenContainer
      title="Ma semaine"
      overline={`Semaine du ${formatLongDate(week.monday).toLowerCase()}`}
    >
      <WeekGrid week={week} today={today} />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total prévu sur la semaine</Text>
        <Text style={styles.totalValue}>{week.total.format()}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.text,
  },
  cardText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },
  link: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
  },
  totalLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.textMuted,
  },
  totalValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.text,
  },
});
