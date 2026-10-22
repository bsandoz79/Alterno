import type { DayPlan, TimeOfDay, WorkedDayInput } from '@alterno/engine';
import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

import { MINUTES_PER_HOUR, dayBlocks, type GridHours } from '@/shared/planning/day-blocks';
import { draggedTime, type StretchRanges, type TimeRange } from '@/shared/planning/time-drag';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';

/** Hauteur de la zone qu'on attrape au doigt, centrée sur l'extrémité du bloc. */
const HANDLE_HEIGHT = 28;

/** Propriétés d'une journée étirable. */
interface StretchableDayProps {
  readonly day: DayPlan;
  /** Plage d'heures de la grille (heures pleines). */
  readonly hours: GridHours;
  /** Hauteur de la colonne en points. */
  readonly height: number;
  /** Jusqu'où étirer l'arrivée et le départ. */
  readonly ranges: StretchRanges;
  /** Nom du jour, lu par les lecteurs d'écran (« lun. 26 oct. »). */
  readonly name: string;
  /** Appelé au lâcher, avec les horaires choisis (pause inchangée). */
  readonly onChange: (times: WorkedDayInput) => void;
  /** Bloc mis en valeur (jour verrouillé). */
  readonly highlighted?: boolean;
}

/** Extrémité en cours de glissement et l'heure qu'elle indique. */
interface Draft {
  readonly edge: 'arrival' | 'departure';
  readonly time: TimeOfDay;
}

/**
 * Journée de l'EDT dont on étire le haut (arrivée) et le bas (départ) au doigt.
 * Pendant le glissement, l'heure s'affiche à la minute près à côté de l'extrémité ;
 * au lâcher, les nouveaux horaires sont transmis (le calcul et la répartition restent au moteur).
 *
 * @param props - Journée, grille, plages autorisées et action au lâcher
 * @returns La colonne de la journée
 */
export function StretchableDay({
  day,
  hours,
  height,
  ranges,
  name,
  onChange,
  highlighted = false,
}: StretchableDayProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const pixelsPerMinute = height / ((hours.end - hours.start) * MINUTES_PER_HOUR);
  const shown: DayPlan = {
    ...day,
    arrival: draft?.edge === 'arrival' ? draft.time : day.arrival,
    departure: draft?.edge === 'departure' ? draft.time : day.departure,
  };
  const blocks = dayBlocks(shown, hours);
  const first = blocks[0];
  const last = blocks.at(-1);
  if (first === undefined || last === undefined) {
    return null;
  }
  const topEdge = first.top * height;
  const bottomEdge = (last.top + last.height) * height;

  const release = (edge: Draft['edge'], time: TimeOfDay): void => {
    setDraft(null);
    onChange({
      arrival: edge === 'arrival' ? time : day.arrival,
      lunchBreak: day.lunchBreak,
      departure: edge === 'departure' ? time : day.departure,
    });
  };

  return (
    <>
      {blocks.map((block) => {
        const blockHeight = block.height * height;
        const isLunch = block.kind === 'lunch';
        return (
          <View
            key={`${block.kind}-${String(block.top)}`}
            style={[
              styles.block,
              isLunch ? styles.lunchBlock : styles.workBlock,
              highlighted && !isLunch && styles.highlightedBlock,
              { top: block.top * height, height: blockHeight },
            ]}
          >
            {blockHeight >= 30 ? (
              <Text style={[styles.blockText, isLunch ? styles.lunchText : styles.workText]}>
                {block.label.replace(' – ', '\n')}
              </Text>
            ) : null}
          </View>
        );
      })}
      <DragHandle
        top={topEdge}
        origin={day.arrival}
        range={ranges.arrival}
        pixelsPerMinute={pixelsPerMinute}
        label={`${name} : arrivée ${shown.arrival.format()}, glisser pour changer`}
        onMove={(time) => {
          setDraft({ edge: 'arrival', time });
        }}
        onRelease={(time) => {
          release('arrival', time);
        }}
      />
      <DragHandle
        top={bottomEdge}
        origin={day.departure}
        range={ranges.departure}
        pixelsPerMinute={pixelsPerMinute}
        label={`${name} : départ ${shown.departure.format()}, glisser pour changer`}
        onMove={(time) => {
          setDraft({ edge: 'departure', time });
        }}
        onRelease={(time) => {
          release('departure', time);
        }}
      />
      {draft === null ? null : (
        <View
          pointerEvents="none"
          style={[
            styles.bubbleRow,
            draft.edge === 'arrival' ? { top: topEdge - 30 } : { top: bottomEdge + 6 },
          ]}
        >
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{draft.time.format()}</Text>
          </View>
        </View>
      )}
    </>
  );
}

/** Propriétés d'une poignée. */
interface DragHandleProps {
  /** Position de l'extrémité dans la colonne, en points. */
  readonly top: number;
  /** Heure au repos (avant glissement). */
  readonly origin: TimeOfDay;
  readonly range: TimeRange;
  readonly pixelsPerMinute: number;
  readonly label: string;
  readonly onMove: (time: TimeOfDay) => void;
  readonly onRelease: (time: TimeOfDay) => void;
}

/**
 * Poignée posée sur une extrémité du bloc. Le geste est suivi par un `PanResponder` (fourni par
 * React Native, aussi sur le web) : pas de dépendance ajoutée pour un simple glissement vertical.
 * Les propriétés sont lues dans une référence, car le geste survit aux rendus qu'il provoque.
 *
 * @param props - Position, heure, plage, échelle et actions
 * @returns La poignée
 */
function DragHandle(props: DragHandleProps) {
  const latest = useRef(props);
  latest.current = props;
  const current = useRef<TimeOfDay | null>(null);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Le défilement de l'écran ne doit pas voler le geste en cours.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        current.current = latest.current.origin;
      },
      onPanResponderMove: (_event, gesture) => {
        const { origin, range, pixelsPerMinute, onMove } = latest.current;
        const time = draggedTime(origin, gesture.dy, pixelsPerMinute, range);
        current.current = time;
        onMove(time);
      },
      onPanResponderRelease: () => {
        const time = current.current;
        current.current = null;
        if (time !== null) {
          latest.current.onRelease(time);
        }
      },
      onPanResponderTerminate: () => {
        const time = current.current;
        current.current = null;
        if (time !== null) {
          latest.current.onRelease(time);
        }
      },
    }),
  ).current;

  return (
    <View
      {...responder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityLabel={props.label}
      style={[styles.handleZone, { top: props.top - HANDLE_HEIGHT / 2 }]}
    >
      <View style={styles.grip} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 6,
  },
  blockText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    lineHeight: 13,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  workText: {
    color: COLORS.surface,
  },
  lunchText: {
    color: COLORS.primary,
  },
  workBlock: {
    backgroundColor: COLORS.primary,
  },
  lunchBlock: {
    backgroundColor: COLORS.primarySoft,
  },
  highlightedBlock: {
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  handleZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HANDLE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  grip: {
    width: '60%',
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  bubbleRow: {
    position: 'absolute',
    left: -12,
    right: -12,
    alignItems: 'center',
    zIndex: 3,
  },
  bubble: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: COLORS.text,
  },
  bubbleText: {
    fontFamily: FONTS.extraBold,
    fontSize: 13,
    color: COLORS.surface,
  },
});
