import { dayProgress, type DayPlan } from '@alterno/engine';
import { StyleSheet, Text, View } from 'react-native';

import { systemClock } from '@/shared/clock/system-clock';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { useCurrentTime } from '../hooks/use-current-time';
import { timeLeftText } from '../time-left';

/**
 * Petit bandeau en haut de l'accueil : l'heure, et le temps restant à travailler aujourd'hui,
 * à la minute près (pause déduite). Mis à jour chaque minute.
 *
 * @param props - Journée prévue aujourd'hui
 * @returns Le bandeau
 */
export function TimeLeftBanner({ day }: { readonly day: DayPlan }) {
  const now = useCurrentTime(systemClock);
  const { headline, detail } = timeLeftText(dayProgress(day, now));
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <Text style={styles.time}>{now.format()}</Text>
      <View style={styles.texts}>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  time: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.textMuted,
  },
  texts: {
    flex: 1,
  },
  headline: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.text,
  },
  detail: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
