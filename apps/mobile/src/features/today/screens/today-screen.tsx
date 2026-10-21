import { SchoolWeeks } from '@alterno/engine';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { systemClock } from '@/shared/clock/system-clock';
import { DefaultPlanNotice } from '@/shared/components/default-plan-notice';
import { RecoveryStatusLink } from '@/shared/components/recovery-status-link';
import { ScreenContainer } from '@/shared/components/screen-container';
import { formatLongDate, formatShortDate } from '@/shared/format/format-date';
import { useRecoveryDay } from '@/shared/hooks/use-recovery-day';
import { useSchoolWeeks } from '@/shared/hooks/use-school-weeks';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { DepartureCard } from '../components/departure-card';
import { ReportChangeCard } from '../components/report-change-card';
import { RestOfWeek } from '../components/rest-of-week';
import { TimeLeftBanner } from '../components/time-left-banner';
import { useTodayPlan } from '../hooks/use-today-plan';
import { recoveryNotice, type RecoveryNotice } from '../recovery-notice';
import { restOfWeek, todayStatus } from '../today-view';

/**
 * Écran « Aujourd'hui » (accueil) : le temps restant à travailler (petit bandeau), l'heure de départ prévue en grand, le bouton
 * « Signaler un changement » et le reste de la semaine. On n'ouvre l'app que pour ça :
 * le plan est considéré comme suivi, seuls les écarts se déclarent. Sans plan validé,
 * la semaine standard est suivie, et un encadré le signale.
 *
 * @returns L'écran
 */
export function TodayScreen() {
  const plan = useTodayPlan();
  const { schoolWeeks } = useSchoolWeeks();
  const recoveryDay = useRecoveryDay(plan);
  const today = systemClock.today();
  const overline = formatLongDate(today);

  if (plan === undefined) {
    return <ScreenContainer title="Aujourd'hui" overline={overline} />;
  }
  const status = todayStatus(plan, schoolWeeks ?? SchoolWeeks.none(), today);
  const rest = plan === null ? [] : restOfWeek(plan, today);

  return (
    <ScreenContainer title="Aujourd'hui" overline={overline}>
      {status.kind === 'work' ? <TimeLeftBanner day={status.day.plan} /> : null}
      {plan === null ? null : <DefaultPlanNotice plan={plan} />}
      {status.kind === 'work' ? (
        <>
          <DepartureCard day={status.day.plan} />
          <ReportChangeCard date={today} />
        </>
      ) : status.kind === 'no-plan' ? (
        <Notice title="Aucun plan validé">
          <Text style={styles.text}>
            Fais une simulation puis « Valider ce plan » : ton heure de départ s’affichera ici.
          </Text>
          <Link href="/simulation" style={styles.link}>
            Aller à la simulation
          </Link>
        </Notice>
      ) : status.kind === 'before-plan' ? (
        <Notice title="Pas de plan pour aujourd’hui">
          <Text style={styles.text}>
            {`Ton plan commence le ${formatShortDate(status.first.date)}. Pour avoir ton heure de départ dès aujourd’hui, simule « Cette semaine ».`}
          </Text>
          <Link href="/simulation" style={styles.link}>
            Aller à la simulation
          </Link>
        </Notice>
      ) : status.kind === 'recovery' ? (
        <RecoveryNoticeCard notice={recoveryNotice(status.recovery, recoveryDay)} />
      ) : status.kind === 'school' ? (
        <Notice title="Journée d’école">
          <Text style={styles.text}>Pas d’horaire en entreprise aujourd’hui. Bon cours !</Text>
        </Notice>
      ) : (
        <Notice title="Rien de prévu aujourd’hui">
          <Text style={styles.text}>
            {status.next === null
              ? 'Ton plan est terminé : fais une nouvelle simulation pour la suite.'
              : `Prochain jour : ${formatShortDate(status.next.date)}, de ${status.next.plan.arrival.format()} à ${status.next.plan.departure.format()}.`}
          </Text>
          <Link href={status.next === null ? '/simulation' : '/semaine'} style={styles.link}>
            {status.next === null ? 'Aller à la simulation' : 'Voir mon planning'}
          </Link>
        </Notice>
      )}
      {rest.length === 0 ? null : <RestOfWeek days={rest} />}
      {plan === null ? null : <RecoveryStatusLink plan={plan} />}
    </ScreenContainer>
  );
}

/**
 * Carte du jour de repos compensatoire.
 *
 * @param props - Titre et texte du message
 * @returns La carte
 */
function RecoveryNoticeCard({ notice }: { readonly notice: RecoveryNotice }) {
  return (
    <Notice title={notice.title}>
      <Text style={styles.text}>{notice.text}</Text>
    </Notice>
  );
}

/**
 * Carte de message quand aujourd'hui n'est pas planifié.
 *
 * @param props - Titre et contenu
 * @returns La carte
 */
function Notice({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.text,
  },
  text: {
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
});
