import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { SPACING } from '@/shared/theme/spacing';

/** Propriétés du conteneur d'écran. */
interface ScreenContainerProps {
  /** Titre de l'écran (« Mon compteur »…). */
  readonly title: string;
  /** Ligne au-dessus du titre, par exemple la date du jour. */
  readonly overline?: string;
  /** Contenu de l'écran. */
  readonly children?: ReactNode;
}

/**
 * Cadre commun à tous les écrans : zone sûre (encoche, barre d'état), fond crème, titre et défilement.
 * Centralisé pour que chaque écran ait exactement la même mise en page.
 *
 * @param props - Titre, surtitre facultatif et contenu
 * @returns L'écran mis en page
 */
export function ScreenContainer({ title, overline, children }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {overline === undefined ? null : <Text style={styles.overline}>{overline}</Text>}
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    // Sur un grand écran (web), le contenu garde une largeur de téléphone, centrée.
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    gap: SPACING.xs,
  },
  overline: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 24,
    color: COLORS.text,
  },
});
