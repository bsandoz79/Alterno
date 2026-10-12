import type { CalendarDate, SchoolWeeks } from '@alterno/engine';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatShortDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import type { MonthCell, MonthView } from '../month-view';
import { dayKind } from '../week-view';

const WEEKDAY_INITIALS = ['L', 'M', 'M', 'J', 'V'] as const;

/** Propriétés de la grille du mois. */
interface MonthGridProps {
  readonly month: MonthView;
  /** Date du jour, mise en évidence. */
  readonly today: CalendarDate;
  /** Appui sur un jour : ouvre sa semaine. */
  readonly onSelectDay: (date: CalendarDate) => void;
  /** Semaines d'école, signalées sur les jours sans plan. */
  readonly schoolWeeks: SchoolWeeks;
}

/**
 * Vue mois : une ligne par semaine, du lundi au vendredi, avec le temps prévu de chaque jour.
 * Les jours planifiés sont sur fond rose ; les jours du mois voisin sont estompés.
 *
 * @param props - Mois à afficher, date du jour et action d'appui sur un jour
 * @returns La grille
 */
export function MonthGrid({ month, today, onSelectDay, schoolWeeks }: MonthGridProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {WEEKDAY_INITIALS.map((initial, index) => (
          <Text key={index} style={styles.weekday} accessibilityElementsHidden>
            {initial}
          </Text>
        ))}
      </View>
      {month.weeks.map((week) => (
        <View key={week.monday.toIsoString()} style={styles.row}>
          {week.cells.map((cell) => (
            <DayCell
              key={cell.date.toIsoString()}
              cell={cell}
              isToday={cell.date.equals(today)}
              school={dayKind(cell, schoolWeeks) === 'school'}
              onPress={() => {
                onSelectDay(cell.date);
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Propriétés d'une case jour. */
interface DayCellProps {
  readonly cell: MonthCell;
  readonly isToday: boolean;
  /** Jour sans plan d'une semaine d'école. */
  readonly school: boolean;
  readonly onPress: () => void;
}

/**
 * Case d'un jour : numéro du jour et temps prévu (rien si le jour n'est pas planifié).
 *
 * @param props - Jour, indicateur « aujourd'hui » et action d'appui
 * @returns La case
 */
function DayCell({ cell, isToday, school, onPress }: DayCellProps) {
  const worked = cell.day?.plan.worked.format() ?? null;
  const label = worked ?? (school ? 'école' : null);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${formatShortDate(cell.date)} : ${label ?? 'rien de prévu'}`}
      style={({ pressed }) => [
        styles.cell,
        worked !== null && styles.cellPlanned,
        school && styles.cellSchool,
        isToday && styles.cellToday,
        !cell.inMonth && styles.cellOutside,
        pressed && styles.cellPressed,
      ]}
    >
      <Text
        style={[styles.dayNumber, school && styles.schoolText, isToday && styles.dayNumberToday]}
      >
        {String(cell.date.day)}
      </Text>
      <Text style={[styles.worked, school && styles.schoolText]}>{label ?? ' '}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.input,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellPlanned: {
    backgroundColor: COLORS.primarySoft,
  },
  cellSchool: {
    backgroundColor: COLORS.text,
  },
  cellToday: {
    borderColor: COLORS.primary,
  },
  cellOutside: {
    opacity: 0.4,
  },
  cellPressed: {
    opacity: 0.7,
  },
  dayNumber: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  dayNumberToday: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
  },
  schoolText: {
    color: COLORS.surface,
  },
  worked: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.primary,
  },
});
