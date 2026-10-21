import type { DatedPlan } from '@alterno/engine';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { recoveryStatusText } from '@/shared/format/recovery-status';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

/**
 * Encadré du statut de la demande de récup (« demande en cours », « acceptée », « refusée »),
 * avec un lien vers l'écran « Ma récup ». Rien n'est affiché sans récup suivie.
 *
 * @param props - Plan en cours
 * @returns L'encadré, ou rien
 */
export function RecoveryStatusLink({ plan }: { readonly plan: DatedPlan }) {
  const status = plan.recovery === undefined ? null : recoveryStatusText(plan.recovery);
  if (status === null) {
    return null;
  }
  const pending = plan.recovery?.approval?.status === 'pending';
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{status}</Text>
      <Link href="/recup" style={styles.link}>
        {pending ? 'Répondre' : 'Voir ma récup'}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.restBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  text: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.positive,
  },
  link: {
    fontFamily: FONTS.extraBold,
    fontSize: 14,
    color: COLORS.primary,
  },
});
