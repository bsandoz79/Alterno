import type { CalendarDate, Simulation, WorkRules, WorkedDayInput } from '@alterno/engine';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DayStretchEditor } from '@/shared/components/day-stretch-editor';
import { formatShortDate } from '@/shared/format/format-date';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import type { EditedDays } from '@/shared/planning/edited-days';

/** Modification des jours dans l'aperçu (objectif d'heures seulement). */
export interface PlanEditing {
  readonly edited: EditedDays;
  /** Règles en vigueur : elles bornent l'étirement des blocs. */
  readonly rules: WorkRules;
  readonly onChange: (date: CalendarDate, times: WorkedDayInput) => void;
  readonly onUnlock: (date: CalendarDate) => void;
}

/** Propriétés de l'aperçu. */
interface PlanPreviewProps {
  readonly simulation: Simulation;
  /** Absent : aperçu en lecture seule (objectif de récup). */
  readonly editing?: PlanEditing;
}

/**
 * Aperçu du plan simulé : une ligne par jour (arrivée, départ, pause, temps travaillé) et le total.
 * En modification, toucher un jour ouvre son bloc : on en étire le haut (arrivée) ou le bas (départ),
 * l'heure s'affichant à la minute près. Le jour devient verrouillé et peut être débloqué.
 *
 * @param props - Simulation à afficher, et la modification des jours si elle est possible
 * @returns L'aperçu
 */
export function PlanPreview({ simulation, editing }: PlanPreviewProps) {
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <View style={styles.card}>
      {simulation.days.map(({ date, plan }) => {
        const key = date.toIsoString();
        const label = formatShortDate(date);
        const locked = editing?.edited[key] !== undefined;
        const isOpen = editing !== undefined && opened === key;
        const row = (
          <View style={styles.row}>
            <View style={styles.dayColumn}>
              <Text style={styles.day}>{label}</Text>
              <Text style={styles.detail}>
                {plan.arrival.format()} → {plan.departure.format()} · pause{' '}
                {plan.lunchBreak.format()}
              </Text>
            </View>
            <Text style={[styles.worked, locked && styles.lockedWorked]}>
              {plan.worked.format()}
            </Text>
          </View>
        );
        return (
          <View key={key} style={styles.dayBlock}>
            {editing === undefined ? (
              row
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${label} : ${isOpen ? 'fermer' : 'choisir les heures'}`}
                onPress={() => {
                  setOpened(isOpen ? null : key);
                }}
              >
                {row}
              </Pressable>
            )}
            {editing !== undefined && isOpen ? (
              <DayStretchEditor
                day={plan}
                rules={editing.rules}
                name={label}
                onChange={(times) => {
                  editing.onChange(date, times);
                }}
              />
            ) : null}
            {editing !== undefined && locked ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  editing.onUnlock(date);
                }}
              >
                <Text style={styles.lockedNote}>Choisi, gardé tel quel · Débloquer</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.worked}>{simulation.totalWorked.format()}</Text>
      </View>
      {editing === undefined ? null : (
        <Text style={styles.hint}>Touche un jour pour étirer ses heures.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  dayBlock: {
    gap: 4,
  },
  hint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  lockedWorked: {
    color: COLORS.primary,
  },
  lockedNote: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  dayColumn: {
    flex: 1,
    gap: 2,
  },
  day: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.text,
  },
  detail: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  worked: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.primarySoft,
    paddingTop: SPACING.md,
  },
  totalLabel: {
    flex: 1,
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.textMuted,
  },
});
