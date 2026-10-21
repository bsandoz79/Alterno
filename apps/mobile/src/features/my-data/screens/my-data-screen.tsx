import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmButton } from '@/shared/components/confirm-button';
import { InfoTip } from '@/shared/components/info-tip';
import { MessageBox } from '@/shared/components/message-box';
import { ScreenContainer } from '@/shared/components/screen-container';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { useMyData } from '../hooks/use-my-data';

/**
 * Page « Mes données » (RGPD) : où sont les données et ce qui est enregistré (à la demande),
 * l'export en JSON, et l'effacement complet, confirmé dans l'écran.
 *
 * @returns L'écran
 */
export function MyDataScreen() {
  const { exportData, eraseAll, message } = useMyData();

  return (
    <ScreenContainer title="Mes données">
      <View style={styles.card}>
        <InfoTip
          title="Tout reste sur ton appareil"
          info="Pas de compte, pas de serveur, aucun traceur ni statistique. Les notifications sont programmées par le téléphone lui-même, et rien n’est envoyé ailleurs."
          titleStyle={styles.title}
        />
        <InfoTip
          title="Ce qu’Alterno enregistre"
          info="Ton plan et ta récup, ton compteur, tes règles horaires et préférences, tes semaines d’école, le calendrier joint et le réglage des notifications."
        />
      </View>

      <Pressable style={styles.button} accessibilityRole="button" onPress={() => void exportData()}>
        <Text style={styles.buttonLabel}>Exporter mes données</Text>
      </Pressable>
      <ConfirmButton
        label="Tout effacer"
        warning="Plan, compteur, réglages, semaines d’école, calendrier joint et notifications : tout est supprimé, l’app repart à zéro."
        confirmLabel="Tout effacer"
        onConfirm={eraseAll}
      />
      {message === null ? null : <MessageBox message={message} />}
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
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
  },
  button: {
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.surface,
  },
});
