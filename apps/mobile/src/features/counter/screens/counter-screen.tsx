import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { BackToZeroLink } from '@/shared/components/back-to-zero-link';
import { MessageBox } from '@/shared/components/message-box';
import { ReminderSettingsCard } from '@/features/reminders/components/reminder-settings-card';
import { ScreenContainer } from '@/shared/components/screen-container';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { BalanceCard } from '../components/balance-card';
import { RecalibrateCard } from '../components/recalibrate-card';
import { UpcomingBalanceCard } from '../components/upcoming-balance-card';
import { useCounter } from '../hooks/use-counter';

/**
 * Écran « Compteur » : solde d'heures, solde à venir à la fin du plan en cours
 * et recalage sur le solde officiel de Smart RH.
 * Donne aussi accès au réglage du rappel de départ et aux règles horaires.
 *
 * @returns L'écran
 */
export function CounterScreen() {
  const { counter, status, upcoming, input, setInput, preview, recalibrate, message } =
    useCounter();

  return (
    <ScreenContainer title="Mon compteur">
      {counter === null || status === null ? null : (
        <>
          <BalanceCard counter={counter} status={status} />
          <BackToZeroLink counter={counter} />
          {upcoming === null ? null : <UpcomingBalanceCard upcoming={upcoming} />}
          <RecalibrateCard
            input={input}
            onChange={setInput}
            preview={preview}
            onRecalibrate={() => void recalibrate()}
          />
          {message === null ? null : <MessageBox message={message} />}
        </>
      )}
      <ReminderSettingsCard />
      <Link href="/reglages" style={styles.settingsLink} accessibilityRole="button">
        <Text style={styles.settingsTitle}>Règles horaires</Text>
      </Link>
      <Link href="/mes-donnees" style={styles.settingsLink} accessibilityRole="button">
        <Text style={styles.settingsTitle}>Mes données</Text>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  settingsLink: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
  },
  settingsTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.primary,
  },
});
