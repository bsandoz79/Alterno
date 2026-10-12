import type { CalendarDate, DatedPlan, Duration } from '@alterno/engine';
import { StyleSheet, Text, View } from 'react-native';

import { SegmentedControl } from '@/shared/components/segmented-control';
import { formatLongDate, formatMonth } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { useCalendarNavigation, type CalendarMode } from '../hooks/use-calendar-navigation';
import { MonthGrid } from './month-grid';
import { PeriodNavigator } from './period-navigator';
import { WeekGrid } from './week-grid';

/** Propriétés du calendrier du plan. */
interface PlanCalendarProps {
  readonly plan: DatedPlan;
  readonly today: CalendarDate;
}

/**
 * Calendrier du plan validé : choix semaine / mois, flèches pour se déplacer, grille et total.
 * Séparé de l'écran pour que le hook de navigation ne s'exécute qu'une fois le plan chargé.
 *
 * @param props - Plan validé et date du jour
 * @returns Le calendrier
 */
export function PlanCalendar({ plan, today }: PlanCalendarProps) {
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
          <WeekGrid week={week} today={today} />
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
          <MonthGrid month={month} today={today} onSelectDay={navigation.showWeek} />
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
