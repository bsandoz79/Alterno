import type { DatedPlan } from '@alterno/engine';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { defaultPlanSummary } from '@/shared/format/default-plan-summary';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/**
 * Encadré « Plan par défaut » : rappelle que la semaine affichée est la semaine standard,
 * et propose la simulation pour en choisir une autre. Rien n'est affiché pour un plan validé.
 *
 * @param props - Plan en cours
 * @returns L'encadré, ou rien
 */
export function DefaultPlanNotice({ plan }: { readonly plan: DatedPlan }) {
  if (plan.isDefault !== true) {
    return null;
  }
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Plan par défaut</Text>
      <Text style={styles.text}>{defaultPlanSummary(plan)}</Text>
      <Link href="/simulation" style={styles.link}>
        Simuler une autre semaine
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.warningBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.text,
  },
  text: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },
  link: {
    fontFamily: FONTS.extraBold,
    fontSize: 14,
    color: COLORS.primary,
  },
});
