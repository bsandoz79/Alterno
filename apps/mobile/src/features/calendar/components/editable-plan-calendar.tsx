import type { CalendarDate, DatedPlan, RecoveryDay, SchoolWeeks } from '@alterno/engine';
import { Pressable, StyleSheet, Text } from 'react-native';

import { MessageBox } from '@/shared/components/message-box';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { useWeekEdit } from '../hooks/use-week-edit';
import { isStretchable, weekEditVerdict } from '../week-edit';
import { PlanCalendar } from './plan-calendar';

/** Propriétés du calendrier modifiable. */
interface EditablePlanCalendarProps {
  readonly plan: DatedPlan;
  readonly today: CalendarDate;
  readonly schoolWeeks: SchoolWeeks;
  readonly recoveryDay: RecoveryDay | null;
  /** Appelé après l'enregistrement d'une modification, pour recharger le plan. */
  readonly onSaved: () => void;
}

/**
 * Calendrier du plan avec le bouton « Modifier » : en mode modification, les blocs des jours à venir
 * s'étirent, le reste du plan est recalculé à chaque lâcher, et l'écran dit si le plan tient
 * ou de combien il dépasse (ou manque) l'objectif, écart qui ira au compteur.
 *
 * @param props - Plan, date du jour, semaines d'école, jour de récup et action après enregistrement
 * @returns Le calendrier et ses commandes
 */
export function EditablePlanCalendar({
  plan,
  today,
  schoolWeeks,
  recoveryDay,
  onSaved,
}: EditablePlanCalendarProps) {
  const edit = useWeekEdit(plan, today, onSaved);
  const canEdit = plan.days.some((day) => isStretchable(day.date, true, today));
  const hasEdits = Object.keys(edit.edits).length > 0;

  return (
    <>
      {edit.active ? (
        <Text style={styles.hint}>Étire le haut ou le bas d’un jour à venir.</Text>
      ) : null}
      <PlanCalendar
        plan={edit.active ? edit.shown : plan}
        today={today}
        schoolWeeks={schoolWeeks}
        recoveryDay={recoveryDay}
        {...(edit.active && edit.rules !== null
          ? { editing: { rules: edit.rules, edits: edit.edits, onChange: edit.change } }
          : {})}
      />
      {!edit.active ? (
        canEdit ? (
          <Pressable style={styles.secondaryButton} accessibilityRole="button" onPress={edit.start}>
            <Text style={styles.secondaryLabel}>Modifier</Text>
          </Pressable>
        ) : null
      ) : (
        <>
          {!hasEdits ? null : edit.preview.ok ? (
            <MessageBox message={weekEditVerdict(plan, edit.preview.plan)} />
          ) : (
            <>
              <MessageBox message={{ kind: 'error', text: edit.preview.error }} />
              {edit.undo === null ? null : (
                <Pressable
                  style={styles.secondaryButton}
                  accessibilityRole="button"
                  onPress={edit.undo}
                >
                  <Text style={styles.secondaryLabel}>Annuler la dernière modification</Text>
                </Pressable>
              )}
              <Pressable
                style={styles.secondaryButton}
                accessibilityRole="button"
                onPress={edit.unlockAll}
              >
                <Text style={styles.secondaryLabel}>Répartir aussi sur les jours étirés</Text>
              </Pressable>
            </>
          )}
          <Pressable
            style={[styles.primaryButton, !edit.preview.ok && styles.disabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !edit.preview.ok }}
            disabled={!edit.preview.ok}
            onPress={() => void edit.save()}
          >
            <Text style={styles.primaryLabel}>Enregistrer</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            accessibilityRole="button"
            onPress={edit.cancel}
          >
            <Text style={styles.secondaryLabel}>Annuler</Text>
          </Pressable>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
  },
  primaryButton: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  primaryLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.surface,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  secondaryLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.primary,
  },
});
