import type { CalendarDate, SchoolWeeks } from '@alterno/engine';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatShortDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { dayBlocks, dayKind, gridHours, type WeekColumn, type WeekView } from '../week-view';

const HOUR_HEIGHT = 46;

const RULER_WIDTH = 34;

/** Propriétés de la grille de la semaine. */
interface WeekGridProps {
  readonly week: WeekView;
  /** Date du jour, mise en évidence dans l'en-tête. */
  readonly today: CalendarDate;
  /** Semaines d'école, affichées à la place des jours sans plan. */
  readonly schoolWeeks: SchoolWeeks;
}

/**
 * Grille de la semaine au format d'un emploi du temps (EDT EPSI) : une colonne par jour,
 * les heures en vertical, le travail en rouge et la pause en rose clair.
 *
 * @param props - Semaine à afficher et date du jour
 * @returns La grille
 */
export function WeekGrid({ week, today, schoolWeeks }: WeekGridProps) {
  const router = useRouter();
  const hours = gridHours(week);
  const hourCount = hours.end - hours.start;
  const height = hourCount * HOUR_HEIGHT;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ width: RULER_WIDTH }} />
        {week.columns.map(({ date }) => {
          const isToday = date.equals(today);
          return (
            <View key={date.toIsoString()} style={[styles.header, isToday && styles.headerToday]}>
              <Text style={[styles.headerText, isToday && styles.headerTextToday]}>
                {formatShortDate(date).replace(/ [^ ]+$/, '')}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.body, { height }]}>
        <View style={{ width: RULER_WIDTH }}>
          {Array.from({ length: hourCount + 1 }, (_, index) => (
            <Text
              key={index}
              style={[styles.hourLabel, { top: index * HOUR_HEIGHT - 7 }]}
              accessibilityElementsHidden
            >
              {`${String(hours.start + index)}h`}
            </Text>
          ))}
        </View>
        {week.columns.map((column) => {
          const { date, day } = column;
          const kind = dayKind(column, schoolWeeks);
          return (
            // Appui sur un jour planifié : ouvre son détail pour le modifier.
            <Pressable
              key={date.toIsoString()}
              style={({ pressed }) => [styles.column, pressed && styles.columnPressed]}
              disabled={day === null}
              accessibilityRole="button"
              accessibilityLabel={`Détail du ${formatShortDate(date)}`}
              onPress={() => {
                router.push({ pathname: '/jour/[date]', params: { date: date.toIsoString() } });
              }}
            >
              {Array.from({ length: hourCount }, (_, index) => (
                <View key={index} style={[styles.hourLine, { top: index * HOUR_HEIGHT }]} />
              ))}
              {day === null ? (
                kind === 'school' ? (
                  <View style={[styles.block, styles.schoolBlock, { top: 0, height }]}>
                    <Text style={styles.schoolText}>École</Text>
                  </View>
                ) : (
                  <Text style={styles.emptyDay}>{kind === 'recovery' ? 'Récup' : '—'}</Text>
                )
              ) : (
                dayBlocks(day.plan, hours).map((block) => (
                  <View
                    key={`${block.kind}-${block.label}`}
                    style={[
                      styles.block,
                      block.kind === 'work' ? styles.workBlock : styles.lunchBlock,
                      { top: block.top * height, height: block.height * height },
                    ]}
                    accessibilityLabel={`${formatShortDate(date)} : ${block.kind === 'work' ? 'travail' : 'pause'} ${block.label}`}
                  >
                    {block.height * height >= 30 ? (
                      <Text
                        style={[
                          styles.blockText,
                          block.kind === 'work' ? styles.workText : styles.lunchText,
                        ]}
                      >
                        {block.label.replace(' – ', '\n')}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <View style={{ width: RULER_WIDTH }} />
        {week.columns.map((column) => (
          <Text key={column.date.toIsoString()} style={styles.footerText}>
            {footerLabel(column, dayKind(column, schoolWeeks))}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * Texte sous une colonne : temps prévu, récup, école, ou tiret pour un jour sans plan.
 *
 * @param column - Colonne de la semaine
 * @param kind - Ce qu'affiche la case
 * @returns Le texte à afficher
 */
function footerLabel(column: WeekColumn, kind: ReturnType<typeof dayKind>): string {
  switch (kind) {
    case 'work':
      return column.day?.plan.worked.format() ?? '—';
    case 'recovery':
      return column.recovery === 'half' ? '½ récup' : 'récup';
    case 'school':
      return 'école';
    case 'none':
      return '—';
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 3,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.input,
  },
  headerToday: {
    backgroundColor: COLORS.primarySoft,
  },
  headerText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  headerTextToday: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
  },
  body: {
    flexDirection: 'row',
    gap: 3,
  },
  hourLabel: {
    position: 'absolute',
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  column: {
    flex: 1,
    position: 'relative',
  },
  columnPressed: {
    opacity: 0.7,
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.border,
  },
  emptyDay: {
    marginTop: SPACING.lg,
    textAlign: 'center',
    color: COLORS.textMuted,
  },
  block: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  schoolBlock: {
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolText: {
    fontFamily: FONTS.extraBold,
    fontSize: 12,
    color: COLORS.surface,
  },
  workBlock: {
    backgroundColor: COLORS.primary,
  },
  lunchBlock: {
    backgroundColor: COLORS.primarySoft,
  },
  blockText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    lineHeight: 13,
  },
  workText: {
    color: COLORS.surface,
  },
  lunchText: {
    color: COLORS.primary,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 3,
  },
  footerText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.extraBold,
    fontSize: 13,
    color: COLORS.text,
  },
});
