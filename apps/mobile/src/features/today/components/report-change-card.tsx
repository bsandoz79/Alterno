import type { CalendarDate } from '@alterno/engine';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CHANGE_KINDS } from '@/features/deviations/report-change';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/**
 * Bloc « Signaler un changement » : un appui sur un choix ouvre la modification du jour
 * avec la seule heure concernée à saisir (deuxième appui : l'heure réelle, puis enregistrer).
 * Les choix viennent de la feature « deviations », qui les traite : une seule source pour les deux écrans.
 *
 * @param props - Date du jour
 * @returns Le bloc
 */
export function ReportChangeCard({ date }: { readonly date: CalendarDate }) {
  const router = useRouter();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Signaler un changement</Text>
      {CHANGE_KINDS.map(({ kind, label }) => (
        <Pressable
          key={kind}
          accessibilityRole="button"
          style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}
          onPress={() => {
            router.push({
              pathname: '/jour/[date]',
              params: { date: date.toIsoString(), change: kind },
            });
          }}
        >
          <Text style={styles.choiceLabel}>{label}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.text,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.primarySoft,
  },
  choicePressed: {
    opacity: 0.7,
  },
  choiceLabel: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.primary,
  },
  chevron: {
    fontFamily: FONTS.extraBold,
    fontSize: 22,
    color: COLORS.primary,
  },
});
