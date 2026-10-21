import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MessageBox } from '@/shared/components/message-box';
import { InfoTip } from '@/shared/components/info-tip';
import { ScreenContainer } from '@/shared/components/screen-container';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { MAX_ATTACHMENT_BYTES, formatFileSize } from '../attachment-rules';
import { AttachedCalendarCard } from '../components/attached-calendar-card';
import { useAnnualCalendar } from '../hooks/use-annual-calendar';

/**
 * Écran « Calendrier annuel » (facultatif) : joindre le calendrier d'alternance de l'école
 * (PDF ou image) pour le retrouver dans l'app. Il ne remplit rien automatiquement :
 * les semaines d'école se marquent à la main (la lecture automatique viendra après la V1).
 *
 * @returns L'écran
 */
export function AnnualCalendarScreen() {
  const { calendar, message, attach, open, remove } = useAnnualCalendar();

  return (
    <ScreenContainer title="Calendrier annuel" overline="Mon alternance">
      <InfoTip
        title="Facultatif"
        info="Joins le calendrier d’alternance de ton école pour l’avoir sous la main. Tes semaines d’école se marquent ensuite dans « Semaines d’école »."
      />

      {calendar === undefined ? null : calendar === null ? (
        <View style={styles.card}>
          <InfoTip
            title="Aucun calendrier joint"
            info={`PDF ou image, ${formatFileSize(MAX_ATTACHMENT_BYTES)} maximum. Le fichier reste sur ton appareil.`}
          />
          <Pressable style={styles.button} accessibilityRole="button" onPress={() => void attach()}>
            <Text style={styles.buttonLabel}>Joindre un fichier</Text>
          </Pressable>
        </View>
      ) : (
        <AttachedCalendarCard
          calendar={calendar}
          onOpen={() => void open()}
          onReplace={() => void attach()}
          onRemove={() => void remove()}
        />
      )}

      {message === null ? null : <MessageBox message={message} />}

      <Link href="/ecole" style={styles.link}>
        Marquer mes semaines d’école
      </Link>
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
  link: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.primary,
    textAlign: 'center',
  },
});
