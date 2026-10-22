import type {
  CalendarDate,
  RecoveryDay,
  SchoolWeeks,
  WorkRules,
  WorkedDayInput,
} from '@alterno/engine';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatShortDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { StretchableDay } from '@/shared/components/stretchable-day';
import { dayBlocks, type DayBlock } from '@/shared/planning/day-blocks';
import type { EditedDays } from '@/shared/planning/edited-days';
import { stretchRanges } from '@/shared/planning/time-drag';

import { isStretchable, stretchGridHours } from '../week-edit';
import { dayKind, gridHours, recoveryBlocks, type WeekColumn, type WeekView } from '../week-view';

/** Mode « Modifier » : les blocs des jours à venir s'étirent. */
export interface GridEditing {
  readonly rules: WorkRules;
  /** Jours déjà étirés (mis en valeur). */
  readonly edits: EditedDays;
  readonly onChange: (date: CalendarDate, times: WorkedDayInput) => void;
}

const HOUR_HEIGHT = 46;

const RULER_WIDTH = 34;

/** Propriétés de la grille de la semaine. */
interface WeekGridProps {
  readonly week: WeekView;
  /** Date du jour, mise en évidence dans l'en-tête. */
  readonly today: CalendarDate;
  /** Semaines d'école, affichées à la place des jours sans plan. */
  readonly schoolWeeks: SchoolWeeks;
  /** Horaires du jour de récup du plan (dessinés dans sa colonne), s'il y en a un. */
  readonly recoveryDay: RecoveryDay | null;
  /** Présent en mode « Modifier ». */
  readonly editing?: GridEditing;
}

/**
 * Grille de la semaine au format d'un emploi du temps (EDT EPSI) : une colonne par jour,
 * les heures en vertical, le travail en rouge, la pause en rose clair et le repos compensatoire
 * en vert (style distinct, comme un autre type de cours).
 * En mode « Modifier », les blocs des jours à venir s'étirent par le haut et par le bas.
 *
 * @param props - Semaine à afficher, date du jour, semaines d'école, horaires du jour de récup
 *   et, en mode « Modifier », de quoi étirer les blocs
 * @returns La grille
 */
export function WeekGrid({ week, today, schoolWeeks, recoveryDay, editing }: WeekGridProps) {
  const router = useRouter();
  // En modification, la grille couvre toute la journée possible, pour avoir de la place où étirer.
  const hours =
    editing === undefined ? gridHours(week, recoveryDay) : stretchGridHours(editing.rules);
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
          if (editing !== undefined && day !== null && isStretchable(date, true, today)) {
            return (
              <View key={date.toIsoString()} style={styles.column}>
                {Array.from({ length: hourCount }, (_, index) => (
                  <View key={index} style={[styles.hourLine, { top: index * HOUR_HEIGHT }]} />
                ))}
                <StretchableDay
                  day={day.plan}
                  hours={hours}
                  height={height}
                  ranges={stretchRanges(editing.rules, day.plan)}
                  name={formatShortDate(date)}
                  highlighted={editing.edits[date.toIsoString()] !== undefined}
                  onChange={(times) => {
                    editing.onChange(date, times);
                  }}
                />
              </View>
            );
          }
          return (
            // Appui sur un jour planifié : ouvre son détail pour le modifier.
            <Pressable
              key={date.toIsoString()}
              style={({ pressed }) => [styles.column, pressed && styles.columnPressed]}
              disabled={day === null || editing !== undefined}
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
                ) : kind === 'recovery' && recoveryDay !== null ? (
                  recoveryBlocks(recoveryDay, hours).map((block) => (
                    <GridBlock key={block.label} block={block} date={date} height={height} />
                  ))
                ) : (
                  <Text style={styles.emptyDay}>{kind === 'recovery' ? 'Récup' : '—'}</Text>
                )
              ) : (
                dayBlocks(day.plan, hours).map((block) => (
                  <GridBlock
                    key={`${block.kind}-${block.label}`}
                    block={block}
                    date={date}
                    height={height}
                  />
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

/** Nom d'un type de bloc, lu par les lecteurs d'écran. */
const BLOCK_NAMES: Readonly<Record<DayBlock['kind'], string>> = {
  work: 'travail',
  lunch: 'pause',
  rest: 'repos compensatoire',
};

/**
 * Bloc dessiné dans une colonne (travail, pause ou repos), à sa place dans la grille.
 *
 * @param props - Bloc, date de la colonne et hauteur de la grille en points
 * @returns Le bloc
 */
function GridBlock({
  block,
  date,
  height,
}: {
  readonly block: DayBlock;
  readonly date: CalendarDate;
  readonly height: number;
}) {
  const blockHeight = block.height * height;
  return (
    <View
      style={[
        styles.block,
        BLOCK_STYLES[block.kind].box,
        { top: block.top * height, height: blockHeight },
      ]}
      accessibilityLabel={`${formatShortDate(date)} : ${block.kind === 'rest' ? block.label : `${BLOCK_NAMES[block.kind]} ${block.label}`}`}
    >
      {blockHeight >= 30 ? (
        <Text style={[styles.blockText, BLOCK_STYLES[block.kind].text]}>
          {gridText(block.label)}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Texte d'un bloc, découpé pour une colonne étroite : une heure par ligne, et
 * « Repos compensatoire » coupé à la syllabe plutôt qu'au milieu d'une lettre.
 *
 * @param label - Libellé du bloc
 * @returns Le texte, sur plusieurs lignes
 */
function gridText(label: string): string {
  return label
    .replace(' – ', '\n')
    .replace(/^Repos compensatoire ?/, 'Repos\ncompen-\nsatoire\n')
    .trim();
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
  restBlock: {
    backgroundColor: COLORS.restBackground,
  },
  restText: {
    color: COLORS.positive,
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

/** Couleurs de chaque type de bloc : fond et texte. */
const BLOCK_STYLES = {
  work: { box: styles.workBlock, text: styles.workText },
  lunch: { box: styles.lunchBlock, text: styles.lunchText },
  rest: { box: styles.restBlock, text: styles.restText },
} as const;
