import { StyleSheet, Text, View } from 'react-native';

import { SegmentedControl } from '@/shared/components/segmented-control';
import { notificationsSupported } from '@/shared/notifications/create-notifier';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { useReminderSettings } from '../hooks/use-reminder-settings';
import { REMINDER_OPTIONS } from '../reminder-options';

/**
 * Carte « Rappel avant le départ » : combien de temps avant l'heure de départ prévue
 * le téléphone prévient, ou pas de rappel.
 *
 * @returns La carte, une fois le réglage chargé
 */
export function ReminderSettingsCard() {
  const { option, choose } = useReminderSettings();
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
        onChange={(next) => void choose(next)}
      />
      <Text style={styles.hint}>
        {notificationsSupported()
          ? 'Une notification te prévient avant l’heure de départ prévue de chaque jour du plan.'
          : 'Les rappels s’affichent dans l’application installée sur Android (APK), pas dans Expo Go ni dans le navigateur.'}
      </Text>
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
});
