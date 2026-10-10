import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/** Propriétés de la carte « bientôt disponible ». */
interface UpcomingCardProps {
  /** Ce que l'écran affichera une fois sa fonctionnalité livrée. */
  readonly description: string;
}

/**
 * Carte d'attente pour un écran dont la fonctionnalité arrive dans un prochain ticket.
 * Permet de livrer la navigation complète tout de suite, sans écran vide.
 *
 * @param props - Description de la fonctionnalité à venir
 * @returns La carte
 */
export function UpcomingCard({ description }: UpcomingCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.badge}>Bientôt</Text>
      <Text style={styles.description}>{description}</Text>
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
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primarySoft,
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 13,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
});
