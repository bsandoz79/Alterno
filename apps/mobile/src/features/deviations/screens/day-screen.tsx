import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/shared/components/screen-container';
import { formatLongDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { DayEditor } from '../components/day-editor';
import { PlannedDayCard } from '../components/planned-day-card';
import { parseDateParam } from '../date-param';
import { useDayContext } from '../hooks/use-day-context';
import { parseChangeKind } from '../report-change';

const OVERLINE = 'Détail du jour';

/**
 * Écran « Détail d'un jour » (/jour/AAAA-MM-JJ), ouvert depuis la grille de la semaine :
 * les horaires prévus, puis la modification du jour avec recalcul de la suite du plan.
 *
 * @returns L'écran
 */
export function DayScreen() {
  const params = useLocalSearchParams();
  const date = parseDateParam(params.date);
  // Ouvert depuis « Signaler un changement » de l'accueil : une seule heure à saisir, retour à l'accueil.
  const change = parseChangeKind(params.change);
  const { context, reload } = useDayContext();

  if (date === null) {
    return <Notice title="Jour introuvable" text="Cette adresse ne correspond à aucune date." />;
  }
  const title = formatLongDate(date);
  if (context === null) {
    return <ScreenContainer title={title} overline={OVERLINE} />;
  }
  const { plan } = context;
  const day = plan?.days.find((candidate) => candidate.date.equals(date));
  if (plan === null || day === undefined) {
    return (
      <Notice
        title={title}
        text="Ce jour ne fait pas partie de ton plan en cours (jour de récup, week-end ou hors période)."
      />
    );
  }

  return (
    <ScreenContainer title={title} overline={OVERLINE}>
      <PlannedDayCard day={day.plan} />
      {/* La clé repart d'un formulaire neuf quand on ouvre un autre jour (l'écran reste monté entre deux visites). */}
      <DayEditor
        key={`${date.toIsoString()}-${change ?? 'all'}`}
        change={change}
        context={{ ...context, plan }}
        date={date}
        planned={day.plan}
        onSaved={reload}
      />
      <Link href={change === null ? '/semaine' : '/'} style={styles.link}>
        {change === null ? 'Retour au planning' : 'Retour à l’accueil'}
      </Link>
    </ScreenContainer>
  );
}

/**
 * Écran réduit à un message, avec le lien de retour au planning.
 *
 * @param props - Titre et explication
 * @returns L'écran
 */
function Notice({ title, text }: { readonly title: string; readonly text: string }) {
  return (
    <ScreenContainer title={title} overline={OVERLINE}>
      <View style={styles.card}>
        <Text style={styles.cardText}>{text}</Text>
        <Link href="/semaine" style={styles.link}>
          Retour au planning
        </Link>
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
    textAlign: 'center',
  },
});
