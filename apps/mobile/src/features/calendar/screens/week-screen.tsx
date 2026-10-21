import { SchoolWeeks } from '@alterno/engine';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { systemClock } from '@/shared/clock/system-clock';
import { ConfirmButton } from '@/shared/components/confirm-button';
import { DefaultPlanNotice } from '@/shared/components/default-plan-notice';
import { MessageBox, type FormMessage } from '@/shared/components/message-box';
import { RecoveryStatusLink } from '@/shared/components/recovery-status-link';
import { ScreenContainer } from '@/shared/components/screen-container';
import { usePlanCancellation } from '@/shared/hooks/use-plan-cancellation';
import { useRecoveryDay } from '@/shared/hooks/use-recovery-day';
import { useSchoolWeeks } from '@/shared/hooks/use-school-weeks';
import { canCancelPlan } from '@/shared/planning/cancellable';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { PlanCalendar } from '../components/plan-calendar';
import { useCurrentPlan } from '../hooks/use-current-plan';

const TITLE = 'Mon planning';

/**
 * Écran « Semaine » : le plan validé (ou, à défaut, la semaine standard), semaine par semaine
 * (grille façon EDT EPSI) ou mois par mois.
 *
 * @returns L'écran
 */
export function WeekScreen() {
  const { plan, reload } = useCurrentPlan();
  const { cancelPlan } = usePlanCancellation();
  const [message, setMessage] = useState<FormMessage | null>(null);
  const { schoolWeeks } = useSchoolWeeks();
  const recoveryDay = useRecoveryDay(plan);
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
      <DefaultPlanNotice plan={plan} />
      <PlanCalendar
        key={planKey}
        plan={plan}
        today={today}
        schoolWeeks={schoolWeeks ?? SchoolWeeks.none()}
        recoveryDay={recoveryDay}
      />
      <RecoveryStatusLink plan={plan} />
      {message === null ? null : <MessageBox message={message} />}
      {canCancelPlan(plan, today) ? (
        <ConfirmButton
          label="Annuler le plan"
          warning="À partir d’aujourd’hui, les jours repassent à 7h et la récup prévue est annulée. Les jours passés sont gardés, ainsi que les heures déjà au compteur."
          confirmLabel="Annuler le plan"
          onConfirm={async () => {
            await cancelPlan(plan);
            setMessage({ kind: 'success', text: 'Plan annulé : la semaine standard reprend.' });
            reload();
          }}
        />
      ) : null}
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
