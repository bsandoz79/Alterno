import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { MessageBox } from '@/shared/components/message-box';
import { ScreenContainer } from '@/shared/components/screen-container';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { BalanceCard } from '../components/balance-card';
import { RecalibrateCard } from '../components/recalibrate-card';
import { useCounter } from '../hooks/use-counter';

/**
 * Écran « Compteur » : solde d'heures et recalage sur le solde officiel de Smart RH.
 * Donne aussi accès aux réglages des règles horaires.
 *
 * @returns L'écran
 */
export function CounterScreen() {
  const { counter, input, setInput, preview, recalibrate, message } = useCounter();

  return (
    <ScreenContainer title="Mon compteur">
      {counter === null ? null : (
        <>
          <BalanceCard counter={counter} />
          <RecalibrateCard
            input={input}
            onChange={setInput}
            preview={preview}
            onRecalibrate={() => void recalibrate()}
          />
          {message === null ? null : <MessageBox message={message} />}
        </>
      )}
      <Link href="/reglages" style={styles.settingsLink} accessibilityRole="button">
        <Text style={styles.settingsTitle}>Règles horaires</Text>
        {'\n'}
        <Text style={styles.settingsHint}>Plages, pause minimale, temps attendu et récups</Text>
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
  settingsHint: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
