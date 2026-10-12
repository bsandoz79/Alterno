import { SchoolWeeks } from '@alterno/engine';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { systemClock } from '@/shared/clock/system-clock';
import { ScreenContainer } from '@/shared/components/screen-container';
import { useSchoolWeeks } from '@/shared/hooks/use-school-weeks';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { PlanCalendar } from '../components/plan-calendar';
import { useCurrentPlan } from '../hooks/use-current-plan';

const TITLE = 'Mon planning';

/**
 * Écran « Semaine » : le plan validé, semaine par semaine (grille façon EDT EPSI) ou mois par mois.
 *
 * @returns L'écran
 */
export function WeekScreen() {
  const plan = useCurrentPlan();
  const { schoolWeeks } = useSchoolWeeks();
  const today = systemClock.today();

  if (plan === undefined) {
    return <ScreenContainer title={TITLE} />;
  }
  if (plan === null) {
    return (
      <ScreenContainer title={TITLE}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aucun plan validé</Text>
          <Text style={styles.cardText}>
            Fais une simulation puis « Valider ce plan » : ta semaine s’affichera ici.
          </Text>
          <Link href="/simulation" style={styles.link}>
            Aller à la simulation
          </Link>
          <Link href="/ecole" style={styles.link}>
            Marquer mes semaines d’école
          </Link>
        </View>
      </ScreenContainer>
    );
  }

  // La clé change quand un autre plan est validé : la navigation repart alors de la semaine du jour.
  const planKey = plan.days.map((day) => day.date.toIsoString()).join();
  return (
    <ScreenContainer title={TITLE}>
      <PlanCalendar
        key={planKey}
        plan={plan}
        today={today}
        schoolWeeks={schoolWeeks ?? SchoolWeeks.none()}
      />
      <Link href="/ecole" style={styles.secondaryLink}>
        Marquer mes semaines d’école
      </Link>
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
  secondaryLink: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
  },
});
