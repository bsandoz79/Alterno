import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

import { withNonBreakingSpaces } from '@/shared/format/french-typography';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { SPACING } from '@/shared/theme/spacing';

/** Propriétés d'un titre avec explication à la demande. */
interface InfoTipProps {
  /** Texte court, toujours visible. */
  readonly title: string;
  /** Explication, affichée seulement après un appui sur l'icône. */
  readonly info: string;
  /** Style du titre (celui de la carte où il est placé). */
  readonly titleStyle?: StyleProp<TextStyle>;
}

/**
 * Titre court suivi d'une icône « i » : l'explication n'apparaît qu'à l'appui, et disparaît au suivant.
 * L'écran reste lisible d'un coup d'œil ; le détail est là pour qui le cherche.
 *
 * @param props - Titre, explication et style du titre
 * @returns Le titre, l'icône et, si elle est ouverte, l'explication
 */
export function InfoTip({ title, info, titleStyle }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        <Pressable
          style={[styles.icon, open && styles.iconOpen]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Explication : ${title}`}
          accessibilityState={{ expanded: open }}
          onPress={() => {
            setOpen((current) => !current);
          }}
        >
          <Text style={[styles.iconText, open && styles.iconTextOpen]}>i</Text>
        </Pressable>
      </View>
      {open ? <Text style={styles.info}>{withNonBreakingSpaces(info)}</Text> : null}
    </View>
  );
}

const ICON_SIZE = 18;

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flexShrink: 1,
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  // Pastille pleine aux couleurs de la charte (rose clair, « i » rouge) : discrète, mais lisible.
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOpen: {
    backgroundColor: COLORS.primary,
  },
  iconText: {
    fontFamily: FONTS.extraBold,
    fontSize: 11,
    lineHeight: ICON_SIZE,
    textAlign: 'center',
    includeFontPadding: false,
    color: COLORS.primary,
  },
  iconTextOpen: {
    color: COLORS.surface,
  },
  info: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
});
