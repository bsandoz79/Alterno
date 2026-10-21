import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { MessageBox } from '@/shared/components/message-box';
import { SegmentedControl } from '@/shared/components/segmented-control';
import { notificationsSupported } from '@/shared/notifications/create-notifier';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { useReminderSettings } from '../hooks/use-reminder-settings';
import {
  APPROVAL_FIRST_DELAY_OPTIONS,
  APPROVAL_REPEAT_OPTIONS,
  REMINDER_OPTIONS,
} from '../reminder-options';

/**
 * Carte « Notifications » : délai du rappel avant le départ, question à l'heure de départ
 * (« tu pars plus tard ? »), question de fin de semaine (« ta semaine s'est passée comme prévu ? »)
 * et suivi de la demande de récup (« ta récup a-t-elle été acceptée ? », avec ses délais).
 * On règle, puis on valide ; un message confirme ce qui a été programmé (ou pourquoi rien ne s'affichera).
 *
 * @returns La carte, une fois le réglage chargé
 */
export function ReminderSettingsCard() {
  const { draft, change, changed, validate, message } = useReminderSettings();
  if (draft === null) {
    return null;
  }
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.label}>Rappel avant le départ</Text>
      <SegmentedControl
        accessibilityLabel="Rappel avant le départ"
        onSurface
        options={REMINDER_OPTIONS}
        selected={draft.lead}
        onChange={(lead) => {
          change({ lead });
        }}
      />
      <SettingSwitch
        label="À l’heure de départ, me demander si je pars plus tard"
        accessibilityLabel="Question à l’heure de départ"
        value={draft.atDeparture}
        onChange={(atDeparture) => {
          change({ atDeparture });
        }}
      />
      <SettingSwitch
        label="En fin de semaine, me demander si elle s’est passée comme prévu"
        accessibilityLabel="Question de fin de semaine"
        value={draft.weekCheck}
        onChange={(weekCheck) => {
          change({ weekCheck });
        }}
      />
      <SettingSwitch
        label="Après une demande de récup, me demander si elle a été acceptée"
        accessibilityLabel="Suivi de la demande de récup"
        value={draft.approvalCheck}
        onChange={(approvalCheck) => {
          change({ approvalCheck });
        }}
      />
      {draft.approvalCheck ? (
        <>
          <Text style={styles.label}>Première question après</Text>
          <SegmentedControl
            accessibilityLabel="Première question de suivi après"
            onSurface
            options={APPROVAL_FIRST_DELAY_OPTIONS}
            selected={draft.approvalFirstDelayDays}
            onChange={(approvalFirstDelayDays) => {
              change({ approvalFirstDelayDays });
            }}
          />
          <Text style={styles.label}>Sans réponse, redemander</Text>
          <SegmentedControl
            accessibilityLabel="Relance du suivi"
            onSurface
            options={APPROVAL_REPEAT_OPTIONS}
            selected={draft.approvalRepeatDays}
            onChange={(approvalRepeatDays) => {
              change({ approvalRepeatDays });
            }}
          />
        </>
      ) : null}
      <Text style={styles.hint}>
        {notificationsSupported()
          ? 'Pour chaque jour du plan. Toucher la question du départ ouvre « Parti plus tard » ; celle de fin de semaine arrive 1h après le dernier départ, avec « Oui » ou « Corriger ».'
          : 'Les notifications s’affichent dans l’application installée sur Android (APK), pas dans Expo Go ni dans le navigateur.'}
      </Text>
      <Pressable
        style={[styles.button, !changed && styles.buttonDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !changed }}
        disabled={!changed}
        onPress={() => void validate()}
      >
        <Text style={styles.buttonLabel}>Valider</Text>
      </Pressable>
      {message === null ? null : <MessageBox message={message} />}
    </View>
  );
}

/** Interrupteur d'un réglage, avec son libellé à gauche. */
function SettingSwitch({
  label,
  accessibilityLabel,
  value,
  onChange,
}: {
  readonly label: string;
  readonly accessibilityLabel: string;
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        accessibilityLabel={accessibilityLabel}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.border, true: COLORS.primarySoft }}
        thumbColor={value ? COLORS.primary : COLORS.surface}
      />
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
    fontSize: 16,
    color: COLORS.text,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  switchLabel: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  hint: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
  button: {
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.surface,
  },
});
