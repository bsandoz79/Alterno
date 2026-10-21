import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MessageBox } from '@/shared/components/message-box';
import { BrandSwitch } from '@/shared/components/brand-switch';
import { InfoTip } from '@/shared/components/info-tip';
import { ScreenContainer } from '@/shared/components/screen-container';
import { SettingsSection } from '@/shared/components/settings-section';
import { TimeField } from '@/shared/components/time-field';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { usePlanningPreferences } from '../hooks/use-planning-preferences';
import { FIELD_LABELS, PREFERENCE_DAYS, PREFERENCE_DAY_LABELS } from '../preferences-form';

/**
 * Écran « Préférences par jour » : habitudes par défaut (arrivée, pause), puis, pour chaque jour,
 * arrivée, pause, départ au plus tard et « 7h pile ». Un champ vide reprend l'habitude par défaut.
 *
 * @returns L'écran
 */
export function PreferencesScreen() {
  const { form, message, updateHabit, updateDay, save, reset } = usePlanningPreferences();

  return (
    <ScreenContainer title="Préférences par jour" overline="Simulation">
      <Link href="/simulation" style={styles.back}>
        ‹ Retour à la simulation
      </Link>
      {form === null ? null : (
        <>
          <SettingsSection title="Mes habitudes">
            <TimeField
              label={FIELD_LABELS.arrival}
              value={form.defaults.arrival}
              onChange={(value) => {
                updateHabit('arrival', value);
              }}
            />
            <TimeField
              label={FIELD_LABELS.lunchStart}
              value={form.defaults.lunchStart}
              onChange={(value) => {
                updateHabit('lunchStart', value);
              }}
            />
            <TimeField
              label={FIELD_LABELS.lunchEnd}
              value={form.defaults.lunchEnd}
              onChange={(value) => {
                updateHabit('lunchEnd', value);
              }}
            />
          </SettingsSection>

          <InfoTip
            title="Préférences par jour"
            info="Pour chaque jour, laisse vide pour garder tes habitudes."
          />

          {PREFERENCE_DAYS.map((day) => {
            const values = form.days[day];
            return (
              <SettingsSection key={day} title={PREFERENCE_DAY_LABELS[day]}>
                <TimeField
                  label={FIELD_LABELS.arrival}
                  value={values.arrival}
                  placeholder={form.defaults.arrival}
                  onChange={(value) => {
                    updateDay(day, 'arrival', value);
                  }}
                />
                <TimeField
                  label={FIELD_LABELS.lunchStart}
                  value={values.lunchStart}
                  placeholder={form.defaults.lunchStart}
                  onChange={(value) => {
                    updateDay(day, 'lunchStart', value);
                  }}
                />
                <TimeField
                  label={FIELD_LABELS.lunchEnd}
                  value={values.lunchEnd}
                  placeholder={form.defaults.lunchEnd}
                  onChange={(value) => {
                    updateDay(day, 'lunchEnd', value);
                  }}
                />
                <TimeField
                  label={FIELD_LABELS.latestDeparture}
                  value={values.latestDeparture}
                  placeholder="—"
                  onChange={(value) => {
                    updateDay(day, 'latestDeparture', value);
                  }}
                />
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Journée à 7h pile</Text>
                  <BrandSwitch
                    value={values.exactlyExpected}
                    onValueChange={(value) => {
                      updateDay(day, 'exactlyExpected', value);
                    }}
                    accessibilityLabel={`${PREFERENCE_DAY_LABELS[day]} : journée à 7h pile`}
                  />
                </View>
              </SettingsSection>
            );
          })}

          {message === null ? null : <MessageBox message={message} />}
          <Pressable
            style={styles.primaryButton}
            accessibilityRole="button"
            onPress={() => void save()}
          >
            <Text style={styles.primaryLabel}>Enregistrer</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} accessibilityRole="button" onPress={reset}>
            <Text style={styles.secondaryLabel}>Tout remettre par défaut</Text>
          </Pressable>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  switchLabel: {
    flex: 1,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.text,
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
  },
});
