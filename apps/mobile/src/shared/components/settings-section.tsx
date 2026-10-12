import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/** Propriétés d'une section de réglages. */
interface SettingsSectionProps {
  readonly title: string;
  readonly children: ReactNode;
}

/**
 * Carte blanche titrée qui regroupe des champs de réglage.
 *
 * @param props - Titre et champs
 * @returns La section
 */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {children}
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
    fontSize: 17,
    color: COLORS.text,
  },
});
