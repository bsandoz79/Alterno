import { RECOVERY_LABELS, type RecoveryAnswer } from '@alterno/engine';
import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmButton } from '@/shared/components/confirm-button';
import { MessageBox } from '@/shared/components/message-box';
import { ScreenContainer } from '@/shared/components/screen-container';
import { systemClock } from '@/shared/clock/system-clock';
import { formatLongDate } from '@/shared/format/format-date';
import { recoveryStatusText } from '@/shared/format/recovery-status';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { useRecoveryApproval } from '../hooks/use-recovery-approval';
import { parseAnswerParam } from '../recovery-answer';

const TITLE = 'Ma récup';

/** Boutons de réponse, dans l'ordre de la notification. */
const ANSWERS: readonly { readonly value: RecoveryAnswer; readonly label: string }[] = [
  { value: 'approved', label: 'Oui' },
  { value: 'refused', label: 'Non' },
  { value: 'not-yet', label: 'Pas encore' },
];

/**
 * Écran « Ma récup » : où en est la demande de repos compensatoire, et la réponse
 * à « L'entreprise l'a-t-elle acceptée ? ». Ouvert depuis la notification de suivi ou la semaine.
 *
 * @returns L'écran
 */
export function RecoveryApprovalScreen() {
  const params = useLocalSearchParams();
  const { recovery, answer, message, cancel } = useRecoveryApproval(
    parseAnswerParam(params.answer),
  );

  if (recovery === undefined) {
    return <ScreenContainer title={TITLE} />;
  }
  const status = recovery === null ? null : recoveryStatusText(recovery);
  if (recovery === null || status === null) {
    return (
      <ScreenContainer title={TITLE}>
        {message === null ? null : <MessageBox message={message} />}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aucune demande suivie</Text>
          <Text style={styles.text}>Pose une récup dans la simulation pour la suivre ici.</Text>
          <Link href="/simulation" style={styles.link}>
            Aller à la simulation
          </Link>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title={TITLE} overline={formatLongDate(recovery.date)}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Repos compensatoire</Text>
        <Text style={styles.text}>{`${capitalize(RECOVERY_LABELS[recovery.kind])}.`}</Text>
        <Text style={styles.status}>{status}</Text>
        {recovery.approval?.status === 'pending' ? (
          <>
            <Text style={styles.question}>L’entreprise a-t-elle accepté ta récup ?</Text>
            <View style={styles.buttons}>
              {ANSWERS.map(({ value, label }) => (
                <Pressable
                  key={value}
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  accessibilityRole="button"
                  onPress={() => void answer(value)}
                >
                  <Text style={styles.buttonLabel}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </View>
      {message === null ? null : <MessageBox message={message} />}
      {/* Refusée ou plus nécessaire : on peut annuler la récup tant qu'elle n'est pas passée. */}
      {recovery.date.isBefore(systemClock.today()) ? null : (
        <ConfirmButton
          label="Annuler la récup"
          warning="Ce jour redevient travaillé et la suite repasse à 7h. L’avance déjà faite reste au compteur."
          confirmLabel="Annuler la récup"
          onConfirm={cancel}
        />
      )}
    </ScreenContainer>
  );
}

/** Met la première lettre en majuscule (début de phrase). */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.text,
  },
  text: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },
  status: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textMuted,
  },
  question: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: COLORS.primaryPressed,
  },
  buttonLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.surface,
  },
  link: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.primary,
  },
});
