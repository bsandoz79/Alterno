import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/shared/components/screen-container';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { SettingsSection } from '../components/settings-section';
import { TimeField } from '@/shared/components/time-field';
import { useWorkRulesSettings, type SettingsMessage } from '../hooks/use-work-rules-settings';
import {
  DAY_GROUP_LABELS,
  DAY_TIME_FIELDS,
  DAY_TIME_LABELS,
  DURATION_FIELDS,
  DURATION_LABELS,
  type DayGroup,
} from '../work-rules-form';

const DAY_GROUPS: readonly DayGroup[] = ['mondayToThursday', 'friday'];

/**
 * Écran « Règles horaires » : plages du lundi au jeudi et du vendredi, pause minimale, temps attendu,
 * valeur des récups. Le preset La Brosse et Dupont s'applique tant que rien n'est enregistré.
 *
 * @returns L'écran
 */
export function WorkRulesScreen() {
  const { form, message, updateDayTime, updateDuration, save, resetToPreset } =
    useWorkRulesSettings();

  return (
    <ScreenContainer title="Règles horaires" overline="Réglages">
      <Link href="/compteur" style={styles.back}>
        ‹ Retour au compteur
      </Link>
      {form === null ? null : (
        <>
          {DAY_GROUPS.map((group) => (
            <SettingsSection key={group} title={DAY_GROUP_LABELS[group]}>
              {DAY_TIME_FIELDS.map((field) => (
                <TimeField
                  key={field}
                  label={DAY_TIME_LABELS[field]}
                  value={form[group][field]}
                  onChange={(value) => {
                    updateDayTime(group, field, value);
                  }}
                />
              ))}
            </SettingsSection>
          ))}
          <SettingsSection title="Pause et compteur">
            {DURATION_FIELDS.map((field) => (
              <TimeField
                key={field}
                label={DURATION_LABELS[field]}
                value={form[field]}
                onChange={(value) => {
                  updateDuration(field, value);
                }}
              />
            ))}
          </SettingsSection>
          {message === null ? null : <MessageBox message={message} />}
          <Pressable
            style={styles.primaryButton}
            accessibilityRole="button"
            onPress={() => void save()}
          >
            <Text style={styles.primaryLabel}>Enregistrer</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            accessibilityRole="button"
            onPress={resetToPreset}
          >
            <Text style={styles.secondaryLabel}>Revenir au preset La Brosse et Dupont</Text>
          </Pressable>
        </>
      )}
    </ScreenContainer>
  );
}

/** Message de résultat : vert si enregistré, ambre si erreur ou information. */
function MessageBox({ message }: { readonly message: SettingsMessage }) {
  const isSuccess = message.kind === 'success';
  return (
    <View
      style={[styles.message, isSuccess ? styles.messageSuccess : styles.messageWarning]}
      accessibilityLiveRegion="polite"
    >
      <Text style={isSuccess ? styles.messageSuccessText : styles.messageWarningText}>
        {message.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.primary,
  },
  primaryButton: {
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.surface,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  secondaryLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.primary,
    textAlign: 'center',
  },
  message: {
    borderRadius: RADIUS.card,
    padding: SPACING.md,
  },
  messageSuccess: {
    backgroundColor: COLORS.surface,
  },
  messageWarning: {
    backgroundColor: COLORS.warningBackground,
  },
  messageSuccessText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.positive,
  },
  messageWarningText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.warningText,
  },
});
