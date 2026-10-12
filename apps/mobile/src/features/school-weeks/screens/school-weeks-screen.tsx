import { YearMonth } from '@alterno/engine';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { systemClock } from '@/shared/clock/system-clock';
import { PeriodNavigator } from '@/shared/components/period-navigator';
import { ScreenContainer } from '@/shared/components/screen-container';
import { formatMonth } from '@/shared/format/format-date';
import { useSchoolWeeks } from '@/shared/hooks/use-school-weeks';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { SchoolWeekRow } from '../components/school-week-row';
import { schoolMonthRows } from '../school-month';

const WEEKDAY_INITIALS = ['L', 'M', 'M', 'J', 'V'] as const;

/**
 * Écran « Semaines d'école » : un calendrier mois par mois où un appui sur une semaine
 * la marque (ou la démarque) comme semaine d'école. Ces jours-là sont exclus des simulations.
 * Chaque appui est enregistré aussitôt : pas de bouton « Enregistrer » à oublier.
 *
 * @returns L'écran
 */
export function SchoolWeeksScreen() {
  const { schoolWeeks, toggle } = useSchoolWeeks();
  const [month, setMonth] = useState(() => YearMonth.containing(systemClock.today()));

  return (
    <ScreenContainer title="Semaines d’école" overline="Mon alternance">
      <Text style={styles.intro}>
        Appuie sur une semaine pour la marquer « école » : elle sera exclue des simulations et
        affichée dans ton planning.
      </Text>
      <PeriodNavigator
        unit="Mois"
        label={formatMonth(month)}
        onPrevious={() => {
          setMonth(month.plusMonths(-1));
        }}
        onNext={() => {
          setMonth(month.plusMonths(1));
        }}
      />
      {schoolWeeks === null ? null : (
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerDays}>
              {WEEKDAY_INITIALS.map((initial, index) => (
                <Text key={index} style={styles.weekday} accessibilityElementsHidden>
                  {initial}
                </Text>
              ))}
            </View>
            <View style={styles.headerBadge} />
          </View>
          {schoolMonthRows(month, schoolWeeks).map((row) => (
            <SchoolWeekRow
              key={row.monday.toIsoString()}
              row={row}
              onToggle={() => void toggle(row.monday)}
            />
          ))}
        </View>
      )}
      <Link href="/calendrier-annuel" style={styles.link}>
        Mon calendrier annuel (PDF ou image)
      </Link>
      <Link href="/semaine" style={styles.link}>
        Voir mon planning
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  headerDays: {
    flex: 1,
    flexDirection: 'row',
  },
  headerBadge: {
    width: 84,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  link: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.primary,
    textAlign: 'center',
  },
});
