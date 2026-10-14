import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MessageBox } from '@/shared/components/message-box';
import { SegmentedControl } from '@/shared/components/segmented-control';
import { notificationsSupported } from '@/shared/notifications/create-notifier';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { useReminderSettings } from '../hooks/use-reminder-settings';
import { REMINDER_OPTIONS } from '../reminder-options';

/**
 * Carte « Rappel avant le départ » : on choisit le délai, puis on le valide ;
 * un message confirme ce qui a été programmé (ou pourquoi rien ne s'affichera).
 *
 * @returns La carte, une fois le réglage chargé
 */
export function ReminderSettingsCard() {
  const { option, choose, changed, validate, message } = useReminderSettings();
  if (option === null) {
    return null;
  }
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Rappel avant le départ</Text>
      <SegmentedControl
        accessibilityLabel="Rappel avant le départ"
        onSurface
        options={REMINDER_OPTIONS}
        selected={option}
        onChange={choose}
      />
      <Text style={styles.hint}>
        {notificationsSupported()
          ? 'Une notification te prévient avant l’heure de départ prévue de chaque jour du plan.'
          : 'Les rappels s’affichent dans l’application installée sur Android (APK), pas dans Expo Go ni dans le navigateur.'}
      </Text>
      <Pressable
        style={[styles.button, !changed && styles.buttonDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !changed }}
        disabled={!changed}
        onPress={() => void validate()}
      >
        <Text style={styles.buttonLabel}>Valider le rappel</Text>
      </Pressable>
      {message === null ? null : <MessageBox message={message} />}
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
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.text,
  },
  hint: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
  button: {
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.surface,
  },
});
