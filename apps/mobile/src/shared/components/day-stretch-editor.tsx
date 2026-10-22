import type { DayPlan, WorkRules, WorkedDayInput } from '@alterno/engine';
import { StyleSheet, Text, View } from 'react-native';

import { MINUTES_PER_HOUR, type GridHours } from '@/shared/planning/day-blocks';
import { stretchRanges } from '@/shared/planning/time-drag';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { SPACING } from '@/shared/theme/spacing';

import { StretchableDay } from './stretchable-day';

/** Hauteur d'une heure : assez pour viser une minute sans trop allonger l'écran. */
const HOUR_HEIGHT = 44;
const RULER_WIDTH = 34;

/** Propriétés de l'éditeur d'une journée. */
interface DayStretchEditorProps {
  readonly day: DayPlan;
  readonly rules: WorkRules;
  /** Nom du jour, lu par les lecteurs d'écran. */
  readonly name: string;
  readonly onChange: (times: WorkedDayInput) => void;
}

/**
 * Une journée seule, sur toute la plage où elle peut s'étendre (de l'arrivée au plus tôt au départ
 * au plus tard), avec une règle des heures : on étire le haut ou le bas du bloc au doigt.
 *
 * @param props - Journée, règles, nom et action au lâcher
 * @returns L'éditeur
 */
export function DayStretchEditor({ day, rules, name, onChange }: DayStretchEditorProps) {
  const ranges = stretchRanges(rules, day);
  const hours: GridHours = {
    start: Math.floor(ranges.arrival.earliest.toMinutesSinceMidnight() / MINUTES_PER_HOUR),
    end: Math.ceil(ranges.departure.latest.toMinutesSinceMidnight() / MINUTES_PER_HOUR),
  };
  const hourCount = hours.end - hours.start;
  const height = hourCount * HOUR_HEIGHT;

  return (
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
      <View style={styles.column}>
        {Array.from({ length: hourCount }, (_, index) => (
          <View key={index} style={[styles.hourLine, { top: index * HOUR_HEIGHT }]} />
        ))}
        <StretchableDay
          day={day}
          hours={hours}
          height={height}
          ranges={ranges}
          name={name}
          onChange={onChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginVertical: SPACING.md,
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
    marginHorizontal: SPACING.xl,
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.border,
  },
});
