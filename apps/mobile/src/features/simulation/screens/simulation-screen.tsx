import type { RecoveryPart } from '@alterno/engine';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MessageBox } from '@/shared/components/message-box';
import { ScreenContainer } from '@/shared/components/screen-container';
import { SegmentedControl } from '@/shared/components/segmented-control';
import { TimeField } from '@/shared/components/time-field';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { PaceOption } from '../components/pace-option';
import { PlanPreview } from '../components/plan-preview';
import { RecoveryDayPicker } from '../components/recovery-day-picker';
import { useSimulation } from '../hooks/use-simulation';
import { paceShapes } from '../pace-shapes';

/**
 * Rythmes proposés. La forme sert tant qu'aucun plan n'est calculable (objectif impossible…) ;
 * sinon chaque carte affiche le vrai graphique de son rythme.
 */
const PACES = [
  {
    value: 'fast',
    title: 'Rapide',
    description: 'Grosses journées d’abord, de la marge en fin de semaine',
    shape: [1, 0.85, 0.5, 0.35, 0.35],
  },
  {
    value: 'steady',
    title: 'Régulier',
    description: 'Le même petit effort chaque jour',
    shape: [0.65, 0.65, 0.65, 0.65, 0.65],
  },
  {
    value: 'late',
    title: 'Au plus juste',
    description: 'Début de semaine tranquille, effort à la fin',
    shape: [0.35, 0.35, 0.5, 0.85, 1],
  },
] as const;

/**
 * Écran « Simulation » : objectif (total d'heures ou récup), période, rythme, puis le plan proposé,
 * recalculé à chaque changement.
 *
 * @returns L'écran
 */
export function SimulationScreen() {
  const {
    context,
    form,
    update,
    recoveryChoices,
    hoursToCatchUp,
    deficitNotice,
    outcome,
    validate,
    message,
  } = useSimulation();
  const shapes = outcome?.ok === true ? paceShapes(outcome.comparison) : null;

  return (
    <ScreenContainer title="Que veux-tu atteindre ?" overline="Nouvelle simulation">
      <SegmentedControl
        accessibilityLabel="Objectif"
        options={[
          { value: 'recovery', label: 'Une récup' },
          { value: 'hours', label: 'Un total d’heures' },
        ]}
        selected={form.objective}
        onChange={(objective) => {
          update({ objective });
        }}
      />

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Période</Text>
        <SegmentedControl
          accessibilityLabel="Début de la période"
          onSurface
          options={[
            { value: 'this-week', label: 'Cette semaine' },
            { value: 'next-week', label: 'Semaine prochaine' },
          ]}
          selected={form.start}
          onChange={(start) => {
            update({ start });
          }}
        />
        <SegmentedControl
          accessibilityLabel="Durée de la période"
          onSurface
          options={[
            { value: 1, label: '1 semaine' },
            { value: 2, label: '2 semaines' },
            { value: 4, label: '1 mois' },
          ]}
          selected={form.weeks}
          onChange={(weeks) => {
            update({ weeks });
          }}
        />

        {form.objective === 'hours' ? (
          <TimeField
            label="Objectif d’heures"
            value={form.target}
            onChange={(target) => {
              update({ target });
            }}
          />
        ) : (
          <>
            <Text style={styles.cardLabel}>Jour de récup</Text>
            <RecoveryDayPicker
              choices={recoveryChoices}
              selected={form.recoveryDate}
              onSelect={(recoveryDate) => {
                update({ recoveryDate });
              }}
            />
            {context === null ? null : (
              <SegmentedControl
                accessibilityLabel="Type de récup"
                onSurface
                options={[
                  { value: 'full', label: `Journée · ${context.rules.fullDayRecovery.format()}` },
                  {
                    value: 'half',
                    label: `Demi-journée · ${context.rules.halfDayRecovery.format()}`,
                  },
                ]}
                selected={form.recoveryKind}
                onChange={(recoveryKind) => {
                  update({ recoveryKind });
                }}
              />
            )}
            {form.recoveryKind === 'half' ? (
              <SegmentedControl<RecoveryPart>
                accessibilityLabel="Moitié en repos"
                onSurface
                options={[
                  { value: 'morning', label: 'Matin en repos' },
                  { value: 'afternoon', label: 'Après-midi en repos' },
                ]}
                selected={form.recoveryPart}
                onChange={(recoveryPart) => {
                  update({ recoveryPart });
                }}
              />
            ) : null}
            {context === null || hoursToCatchUp === null ? null : (
              <View style={styles.catchUp}>
                <Text style={styles.catchUpLabel}>
                  Compteur actuel {context.counter.format()} · à faire avant
                </Text>
                <Text style={styles.catchUpValue}>{hoursToCatchUp.format({ signed: true })}</Text>
              </View>
            )}
            {deficitNotice === null ? null : (
              <MessageBox message={{ kind: 'info', text: deficitNotice }} />
            )}
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>Ton rythme</Text>
      {PACES.map((pace) => (
        <PaceOption
          key={pace.value}
          title={pace.title}
          description={pace.description}
          shape={shapes?.[pace.value] ?? pace.shape}
          selected={form.pace === pace.value}
          onSelect={() => {
            update({ pace: pace.value });
          }}
        />
      ))}

      <Link href="/preferences" style={styles.preferencesLink}>
        Ajuster mes préférences par jour
      </Link>
      <Link href="/ecole" style={styles.preferencesLink}>
        Marquer mes semaines d’école
      </Link>

      <Text style={styles.sectionTitle}>Plan proposé</Text>
      {outcome === null ? null : outcome.ok ? (
        <>
          <PlanPreview simulation={outcome.simulation} />
          {message === null ? null : <MessageBox message={message} />}
          <Pressable
            style={styles.validateButton}
            accessibilityRole="button"
            onPress={() => void validate()}
          >
            <Text style={styles.validateLabel}>Valider ce plan</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.error} accessibilityLiveRegion="polite">
          <Text style={styles.errorText}>{outcome.error}</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  cardLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  catchUp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.primarySoft,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  catchUpLabel: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  catchUpValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 14,
    color: COLORS.text,
  },
  preferencesLink: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.text,
  },
  validateButton: {
    height: 58,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.surface,
  },
  error: {
    backgroundColor: COLORS.warningBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
  },
  errorText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.warningText,
  },
});
