import type { CalendarDate, DatedPlan, Duration, RecoveryDay, SchoolWeeks } from '@alterno/engine';
import { StyleSheet, Text, View } from 'react-native';

import { PeriodNavigator } from '@/shared/components/period-navigator';
import { SegmentedControl } from '@/shared/components/segmented-control';
import { formatLongDate, formatMonth } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { useCalendarNavigation, type CalendarMode } from '../hooks/use-calendar-navigation';
import { MonthGrid } from './month-grid';
import { WeekGrid, type GridEditing } from './week-grid';

/** Propriétés du calendrier du plan. */
interface PlanCalendarProps {
  readonly plan: DatedPlan;
  readonly today: CalendarDate;
  readonly schoolWeeks: SchoolWeeks;
  /** Horaires du jour de récup du plan, s'il y en a un. */
  readonly recoveryDay: RecoveryDay | null;
  /** Présent en mode « Modifier » : les blocs à venir s'étirent. */
  readonly editing?: GridEditing;
}

/**
 * Calendrier du plan validé : choix semaine / mois, flèches pour se déplacer, grille et total.
 * Séparé de l'écran pour que le hook de navigation ne s'exécute qu'une fois le plan chargé.
 *
 * @param props - Plan validé, date du jour, semaines d'école, horaires du jour de récup
 *   et, en mode « Modifier », de quoi étirer les blocs
 * @returns Le calendrier
 */
export function PlanCalendar({
  plan,
  today,
  schoolWeeks,
  recoveryDay,
  editing,
}: PlanCalendarProps) {
  const navigation = useCalendarNavigation(plan, today);
  const { week, month } = navigation;
  const previousWeek = navigation.weekNavigation.previous;
  const nextWeek = navigation.weekNavigation.next;
  const previousMonth = navigation.monthNavigation.previous;
  const nextMonth = navigation.monthNavigation.next;

  return (
    <>
      <SegmentedControl<CalendarMode>
        accessibilityLabel="Vue du calendrier"
        options={[
          { value: 'week', label: 'Semaine' },
          { value: 'month', label: 'Mois' },
        ]}
        selected={navigation.mode}
        onChange={navigation.changeMode}
      />

      {navigation.mode === 'week' ? (
        <>
          <PeriodNavigator
            unit="Semaine"
            label={`Semaine du ${formatLongDate(week.monday).toLowerCase()}`}
            onPrevious={
              previousWeek === null
                ? null
                : () => {
                    navigation.showWeek(previousWeek);
                  }
            }
            onNext={
              nextWeek === null
                ? null
                : () => {
                    navigation.showWeek(nextWeek);
                  }
            }
          />
          <WeekGrid
            week={week}
            today={today}
            schoolWeeks={schoolWeeks}
            recoveryDay={recoveryDay}
            {...(editing === undefined ? {} : { editing })}
          />
          <TotalRow label="Total prévu sur la semaine" total={week.total} />
        </>
      ) : (
        <>
          <PeriodNavigator
            unit="Mois"
            label={formatMonth(month.month)}
            onPrevious={
              previousMonth === null
                ? null
                : () => {
                    navigation.showMonth(previousMonth);
                  }
            }
            onNext={
              nextMonth === null
                ? null
                : () => {
                    navigation.showMonth(nextMonth);
                  }
            }
          />
          <MonthGrid
            month={month}
            today={today}
            onSelectDay={navigation.showWeek}
            schoolWeeks={schoolWeeks}
          />
          <TotalRow label="Total prévu sur le mois" total={month.total} />
        </>
      )}
    </>
  );
}

/** Propriétés de la ligne de total. */
interface TotalRowProps {
  readonly label: string;
  readonly total: Duration;
}

/**
 * Carte « Total prévu » sous la grille.
 *
 * @param props - Libellé et durée
 * @returns La carte
 */
function TotalRow({ label, total }: TotalRowProps) {
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>{total.format()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
